import os
import csv
import json
from datetime import datetime
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

# 数据文件路径
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), '数据')

def parse_csv_file(filepath):
    """解析CSV文件，返回GPS数据列表"""
    data = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    # 解析数据
                    commaddr = row.get('COMMADDR', '').strip()
                    utc = int(row.get('UTC', 0))
                    lat = int(row.get('LAT', 0)) / 100000.0  # 转换为实际坐标
                    lon = int(row.get('LON', 0)) / 100000.0
                    head = int(row.get('HEAD', 0))
                    speed = int(row.get('SPEED', 0))
                    
                    data.append({
                        'commaddr': commaddr,
                        'utc': utc,
                        'lat': lat,
                        'lon': lon,
                        'head': head,
                        'speed': speed
                    })
                except (ValueError, KeyError) as e:
                    continue
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
    return data

def get_all_data():
    """获取所有CSV文件的数据"""
    all_data = []
    # 遍历所有数据目录
    for root, dirs, files in os.walk(DATA_DIR):
        for file in files:
            if file.endswith('.csv'):
                filepath = os.path.join(root, file)
                print(f"Loading data from: {filepath}")
                data = parse_csv_file(filepath)
                all_data.extend(data)
                print(f"Loaded {len(data)} records from {file}")
    return all_data

# 全局缓存数据
CACHED_DATA = None

def get_cached_data():
    """获取缓存的数据，如果没有则加载"""
    global CACHED_DATA
    if CACHED_DATA is None:
        print("Loading GPS data from CSV files...")
        CACHED_DATA = get_all_data()
        print(f"Total records loaded: {len(CACHED_DATA)}")
    return CACHED_DATA

@csrf_exempt
@require_http_methods(["POST"])
def query_by_time(request):
    """
    按时间查询GPS数据
    请求参数: start_time, end_time (ISO格式)
    返回: 该时间段内的GPS点数据
    """
    try:
        # 解析请求体
        body = json.loads(request.body)
        start_time_str = body.get('startTime')
        end_time_str = body.get('endTime')
        
        if not start_time_str or not end_time_str:
            return JsonResponse({
                'success': False,
                'message': '缺少开始时间或结束时间参数'
            }, status=400)
        
        # 解析时间
        start_time = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
        end_time = datetime.fromisoformat(end_time_str.replace('Z', '+00:00'))
        
        # 转换为UTC时间戳
        start_timestamp = int(start_time.timestamp())
        end_timestamp = int(end_time.timestamp())
        
        print(f"Querying data from {start_time} to {end_time}")
        print(f"Timestamp range: {start_timestamp} to {end_timestamp}")
        
        # 获取数据
        all_data = get_cached_data()
        
        # 筛选时间范围内的数据
        filtered_data = []
        for record in all_data:
            if start_timestamp <= record['utc'] <= end_timestamp:
                filtered_data.append(record)
        
        print(f"Found {len(filtered_data)} records in time range")
        
        # 限制返回的数据量，避免过多
        max_records = 5000
        if len(filtered_data) > max_records:
            # 随机采样
            import random
            filtered_data = random.sample(filtered_data, max_records)
            print(f"Sampled to {max_records} records")
        
        return JsonResponse({
            'success': True,
            'data': filtered_data,
            'total': len(filtered_data),
            'start_time': start_time_str,
            'end_time': end_time_str
        })
        
    except Exception as e:
        print(f"Error in query_by_time: {e}")
        return JsonResponse({
            'success': False,
            'message': f'查询失败: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def query_by_car(request):
    """
    按车辆查询GPS轨迹
    请求参数: carId, start_time, end_time
    """
    try:
        body = json.loads(request.body)
        car_id = body.get('carId')
        start_time_str = body.get('startTime')
        end_time_str = body.get('endTime')
        
        if not car_id or not start_time_str or not end_time_str:
            return JsonResponse({
                'success': False,
                'message': '缺少必要参数'
            }, status=400)
        
        # 解析时间
        start_time = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
        end_time = datetime.fromisoformat(end_time_str.replace('Z', '+00:00'))
        start_timestamp = int(start_time.timestamp())
        end_timestamp = int(end_time.timestamp())
        
        # 获取数据
        all_data = get_cached_data()
        
        # 筛选特定车辆和时间范围的数据
        filtered_data = []
        for record in all_data:
            if (record['commaddr'] == car_id and 
                start_timestamp <= record['utc'] <= end_timestamp):
                filtered_data.append(record)
        
        # 按时间排序
        filtered_data.sort(key=lambda x: x['utc'])
        
        return JsonResponse({
            'success': True,
            'data': filtered_data,
            'total': len(filtered_data),
            'car_id': car_id
        })
        
    except Exception as e:
        print(f"Error in query_by_car: {e}")
        return JsonResponse({
            'success': False,
            'message': f'查询失败: {str(e)}'
        }, status=500)

def test_api(request):
    """测试API是否正常工作"""
    return JsonResponse({
        'success': True,
        'message': 'API is working',
        'data_count': len(get_cached_data())
    })
