// script.js
/**
 * 全局变量
 */
let map = null;                    // 地图实例
let markers = [];                  // 标记点数组
let circles = [];                  // 圆形标记数组
let polylines = [];                // 轨迹线数组
let infoWindows = [];              // 信息窗口数组
let currentOverlayType = 'marker'; // 当前覆盖物类型

/**
 * 初始化百度地图
 * 使用百度地图JavaScript API v3.0
 */
function initBaiduMap() {
    // 确保地图容器存在
    var mapDiv = document.getElementById('map-container');
    if (!mapDiv) {
        console.error('地图容器 #map-container 未找到！');
        return;
    }

    try {
        // 创建地图实例 - 使用BMap命名空间(v3.0标准版)
        map = new BMap.Map("map-container");

        // 设置中心点坐标（济南市中心坐标）
        var point = new BMap.Point(117.078115728003, 36.6721433229127);

        // 初始化地图，设置中心点和缩放级别
        map.centerAndZoom(point, 15);

        // 启用鼠标滚轮缩放
        map.enableScrollWheelZoom(true);

        // 添加平移和缩放控件
        map.addControl(new BMap.NavigationControl());

        // 添加比例尺控件
        map.addControl(new BMap.ScaleControl());

        // 添加地图类型控件
        map.addControl(new BMap.MapTypeControl());

        // 添加缩略图控件
        map.addControl(new BMap.OverviewMapControl());

        console.log('百度地图v3.0初始化完成。');
    } catch (error) {
        console.error('百度地图初始化失败:', error);
        document.getElementById('map-container').innerHTML = '<div style="text-align:center; padding-top:50px; color:red;">地图加载失败，请检查网络连接或API密钥</div>';
    }
}

/**
 * 清除地图上所有标记
 */
function clearAllMarkers() {
    if (!map) return;
    
    // 清除标记点
    markers.forEach(marker => map.removeOverlay(marker));
    markers = [];
    
    // 清除圆形标记
    circles.forEach(circle => map.removeOverlay(circle));
    circles = [];
    
    // 清除轨迹线
    polylines.forEach(polyline => map.removeOverlay(polyline));
    polylines = [];
    
    // 关闭信息窗口
    infoWindows.forEach(infoWindow => map.closeInfoWindow(infoWindow));
    infoWindows = [];
    
    console.log('已清除所有地图标记');
}

/**
 * 在地图上添加GPS点标记
 * @param {Array} data - GPS数据数组
 * @param {String} type - 标记类型: 'marker' | 'circle' | 'heatmap'
 */
function addMarkersToMap(data, type = 'marker') {
    if (!map || !data || data.length === 0) {
        console.warn('没有数据可显示');
        return;
    }
    
    // 先清除之前的标记
    clearAllMarkers();
    
    console.log(`正在添加 ${data.length} 个标记点到地图`);
    
    // 计算中心点
    let totalLat = 0, totalLon = 0;
    
    data.forEach((point, index) => {
        const lat = point.lat;
        const lon = point.lon;
        
        totalLat += lat;
        totalLon += lon;
        
        const bmapPoint = new BMap.Point(lon, lat);
        
        if (type === 'marker') {
            // 创建标准标记点
            const marker = new BMap.Marker(bmapPoint);
            
            // 添加信息窗口
            const infoContent = `
                <div style="padding: 10px;">
                    <h5>车辆信息</h5>
                    <p>车牌号: ${point.commaddr}</p>
                    <p>时间: ${new Date(point.utc * 1000).toLocaleString()}</p>
                    <p>速度: ${point.speed} km/h</p>
                    <p>方向: ${point.head}°</p>
                    <p>坐标: ${lat.toFixed(6)}, ${lon.toFixed(6)}</p>
                </div>
            `;
            const infoWindow = new BMap.InfoWindow(infoContent);
            
            marker.addEventListener('click', function() {
                map.openInfoWindow(infoWindow, bmapPoint);
            });
            
            map.addOverlay(marker);
            markers.push(marker);
            
        } else if (type === 'circle') {
            // 创建圆形标记
            const circle = new BMap.Circle(bmapPoint, 50, {
                strokeColor: 'blue',
                strokeWeight: 2,
                strokeOpacity: 0.5,
                fillColor: 'blue',
                fillOpacity: 0.3
            });
            
            map.addOverlay(circle);
            circles.push(circle);
        }
    });
    
    // 调整地图视野以显示所有标记
    if (data.length > 0) {
        const centerLat = totalLat / data.length;
        const centerLon = totalLon / data.length;
        const centerPoint = new BMap.Point(centerLon, centerLat);
        
        map.centerAndZoom(centerPoint, 14);
        
        // 如果有多个点，调整缩放级别以显示所有点
        if (data.length > 1) {
            const bounds = new BMap.Bounds();
            data.forEach(point => {
                bounds.extend(new BMap.Point(point.lon, point.lat));
            });
            map.setViewport(bounds);
        }
    }
    
    console.log(`成功添加 ${data.length} 个标记点`);
}

/**
 * 绘制车辆轨迹
 * @param {Array} data - GPS数据数组（已按时间排序）
 */
function drawTrajectory(data) {
    if (!map || !data || data.length < 2) {
        console.warn('数据不足，无法绘制轨迹');
        return;
    }
    
    // 清除之前的轨迹
    polylines.forEach(polyline => map.removeOverlay(polyline));
    polylines = [];
    
    // 创建轨迹点数组
    const points = data.map(point => new BMap.Point(point.lon, point.lat));
    
    // 创建折线
    const polyline = new BMap.Polyline(points, {
        strokeColor: 'red',
        strokeWeight: 3,
        strokeOpacity: 0.8
    });
    
    map.addOverlay(polyline);
    polylines.push(polyline);
    
    // 添加起点和终点标记
    const startPoint = points[0];
    const endPoint = points[points.length - 1];
    
    const startMarker = new BMap.Marker(startPoint, {
        icon: new BMap.Icon('http://api.map.baidu.com/img/markers.png', 
            new BMap.Size(23, 25), {
            offset: new BMap.Size(10, 25),
            imageOffset: new BMap.Size(0, 0)
        })
    });
    
    const endMarker = new BMap.Marker(endPoint, {
        icon: new BMap.Icon('http://api.map.baidu.com/img/markers.png', 
            new BMap.Size(23, 25), {
            offset: new BMap.Size(10, 25),
            imageOffset: new BMap.Size(0, -25)
        })
    });
    
    map.addOverlay(startMarker);
    map.addOverlay(endMarker);
    markers.push(startMarker, endMarker);
    
    console.log(`成功绘制轨迹，共 ${points.length} 个点`);
}

/**
 * 处理"按时间查询"表单的提交
 */
function handleTimeQuery(event) {
    event.preventDefault();

    const formData = {
        'startTime': $('#startTime').val(),
        'endTime': $('#endTime').val()
    };

    // 表单验证
    if (!formData.startTime || !formData.endTime) {
        alert('请填写完整的起止时间！');
        return false;
    }
    if (new Date(formData.startTime) >= new Date(formData.endTime)) {
        alert('开始时间必须早于结束时间！');
        return false;
    }

    // 显示加载提示
    $('#map-title').text('正在查询，请稍候...');
    
    // 禁用查询按钮
    const $btn = $('#timeQueryForm button[type="submit"]');
    $btn.prop('disabled', true).text('查询中...');

    // 发送Ajax请求
    $.ajax({
        url: 'http://localhost:8000/query_by_time/',
        type: 'POST',
        data: JSON.stringify(formData),
        contentType: 'application/json',
        dataType: 'json',
        success: function(response) {
            if (response.success && response.data) {
                // 在地图上显示标记
                addMarkersToMap(response.data, 'marker');
                
                $('#map-title').text(`时间段车辆分布 - 共 ${response.total} 辆车`);
                
                // 显示成功提示
                if (response.total > 0) {
                    console.log(`成功加载 ${response.total} 个GPS点`);
                } else {
                    alert('该时间段内没有找到车辆数据');
                }
            } else {
                alert('查询失败：' + (response.message || '未知错误'));
                $('#map-title').text('济南市出租车GPS数据地图');
            }
        },
        error: function(xhr, status, error) {
            console.error("AJAX Error:", status, error);
            alert('网络请求失败，请确保后端服务已启动（python manage.py runserver）');
            $('#map-title').text('济南市出租车GPS数据地图');
        },
        complete: function() {
            // 恢复按钮状态
            $btn.prop('disabled', false).text('查询该时段车辆分布');
        }
    });

    return false;
}

/**
 * 处理"按车辆查询"表单的提交
 */
function handleCarQuery(event) {
    event.preventDefault();

    const formData = {
        'carId': $('#carId').val(),
        'startTime': $('#carStartTime').val(),
        'endTime': $('#carEndTime').val()
    };

    if (!formData.carId || !formData.startTime || !formData.endTime) {
        alert('请填写完整的车牌号、起止时间！');
        return false;
    }
    if (new Date(formData.startTime) >= new Date(formData.endTime)) {
        alert('开始时间必须早于结束时间！');
        return false;
    }

    $('#map-title').text('正在查询车辆轨迹，请稍候...');
    
    // 禁用查询按钮
    const $btn = $('#carQueryForm button[type="submit"]');
    $btn.prop('disabled', true).text('查询中...');

    $.ajax({
        url: 'http://localhost:8000/query_by_car/',
        type: 'POST',
        data: JSON.stringify(formData),
        contentType: 'application/json',
        dataType: 'json',
        success: function(response) {
            if (response.success && response.data) {
                // 绘制车辆轨迹
                drawTrajectory(response.data);
                
                $('#map-title').text(`车辆轨迹 - ${formData.carId} (${response.total} 个点)`);
                
                if (response.total === 0) {
                    alert('未找到该车辆在该时间段的轨迹数据');
                }
            } else {
                alert('查询失败：' + (response.message || '未知错误'));
                $('#map-title').text('济南市出租车GPS数据地图');
            }
        },
        error: function(xhr, status, error) {
            console.error("AJAX Error:", status, error);
            alert('网络请求失败，请确保后端服务已启动（python manage.py runserver）');
            $('#map-title').text('济南市出租车GPS数据地图');
        },
        complete: function() {
            // 恢复按钮状态
            $btn.prop('disabled', false).text('查询车辆轨迹');
        }
    });

    return false;
}

/**
 * 页面加载完成后初始化
 */
$(document).ready(function() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    // 格式化为HTML datetime-local input所需的格式
    const formatDate = (date) => date.toISOString().slice(0, 16);

    // 设置默认查询时间为昨天的一个小时区间
    $('#startTime').val(formatDate(new Date(yesterday.setHours(10, 0, 0, 0))));
    $('#endTime').val(formatDate(new Date(yesterday.setHours(11, 0, 0, 0))));
    $('#carStartTime').val(formatDate(new Date(yesterday.setHours(10, 0, 0, 0))));
    $('#carEndTime').val(formatDate(new Date(yesterday.setHours(11, 0, 0, 0))));

    // 初始化百度地图
    initBaiduMap();
    
    // 添加清除标记按钮事件
    $('#clearMarkersBtn').on('click', function() {
        clearAllMarkers();
        $('#map-title').text('济南市出租车GPS数据地图');
    });
});
