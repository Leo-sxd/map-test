// script.js
/**
 * 【修改点1/1：新增百度地图初始化函数】
 * 根据文档1“任务11”的指导，创建并初始化地图。
 */
function initBaiduMap() {
    // 确保地图容器存在
    var mapDiv = document.getElementById('map-container');
    if (!mapDiv) {
        console.error('地图容器 #map-container 未找到！');
        return;
    }

    // 创建地图实例，使用BMapGL（WebGL版，性能更好）
    var map = new BMapGL.Map("map-container");

    // 设置中心点坐标（使用文档中提供的济南坐标）
    var point = new BMapGL.Point(117.078115728003, 36.6721433229127);

    // 初始化地图，设置中心点和缩放级别（文档中使用15级）
    map.centerAndZoom(point, 15);

    // 启用鼠标滚轮缩放
    map.enableScrollWheelZoom(true);

    // 可选：添加平移和缩放控件
    map.addControl(new BMapGL.NavigationControl());

    // 将地图实例保存到全局变量，方便其他函数（如查询后添加标记）调用
    window.baiduMap = map;
    console.log('百度地图初始化完成。');
}

/**
 * 处理“按时间查询”表单的提交
 * 此函数会阻止表单默认提交，并通过Ajax将查询条件发送到Django后端。
 * 后端处理并返回结果页面URL，前端动态更新右侧的iframe以显示查询结果。
 */
function handleTimeQuery(event) {
    event.preventDefault(); // 阻止表单默认提交刷新页面

    const formData = {
        'startTime': $('#startTime').val(),
        'endTime': $('#endTime').val()
    };

    // 简单的表单验证
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

    // 发送Ajax请求到Django后端
    // 注意：这里的URL `/query_by_time/` 需要与你在Django项目的urls.py中配置的路由一致
    $.ajax({
        url: '/query_by_time/',
        type: 'POST',
        data: JSON.stringify(formData),
        contentType: 'application/json',
        headers: {
            'X-CSRFToken': getCookie('csrftoken') // Django需要CSRF Token
        },
        success: function(response) {
            if (response.success && response.map_url) {
                // 动态改变iframe的src，加载查询结果地图页面
                // 注意：由于我们已替换为百度地图容器，此部分逻辑未来需改为直接在地图上添加覆盖物
                // 目前为保持代码结构，暂时注释掉iframe相关操作，并给出提示
                // $('#mainMapFrame').attr('src', response.map_url);
                alert('查询功能后端接口已调用。前端地图已就绪，待集成查询结果数据渲染逻辑。');
                $('#map-title').text('时间段车辆分布查询结果 (地图已加载)');
            } else {
                alert('查询失败：' + (response.message || '未知错误'));
                $('#map-title').text('济南市出租车GPS数据地图');
            }
        },
        error: function(xhr, status, error) {
            console.error("AJAX Error:", status, error);
            alert('网络请求失败，请检查控制台或联系管理员。');
            $('#map-title').text('济南市出租车GPS数据地图');
        }
    });

    return false; // 保持表单不提交
}

/**
 * 处理“按车辆查询”表单的提交
 * 逻辑与按时间查询类似，但查询参数不同。
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

    // 注意：这里的URL `/query_by_car/` 需要与你在Django项目的urls.py中配置的路由一致
    $.ajax({
        url: '/query_by_car/',
        type: 'POST',
        data: JSON.stringify(formData),
        contentType: 'application/json',
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        },
        success: function(response) {
            if (response.success && response.map_url) {
                // 动态改变iframe的src，加载查询结果地图页面
                // 注意：由于我们已替换为百度地图容器，此部分逻辑未来需改为直接在地图上添加覆盖物
                // $('#mainMapFrame').attr('src', response.map_url);
                alert('车辆轨迹查询功能后端接口已调用。前端地图已就绪，待集成轨迹绘制逻辑。');
                $('#map-title').text('车辆轨迹查询结果 - 车牌号: ' + formData.carId);
            } else {
                alert('查询失败：' + (response.message || '未知错误'));
                $('#map-title').text('济南市出租车GPS数据地图');
            }
        },
        error: function(xhr, status, error) {
            console.error("AJAX Error:", status, error);
            alert('网络请求失败，请检查控制台或联系管理员。');
            $('#map-title').text('济南市出租车GPS数据地图');
        }
    });

    return false;
}

/**
 * 辅助函数：获取Cookie值，用于获取CSRF Token
 */
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

/**
 * 页面加载完成后，为时间输入框设置一个合理的默认值（例如，文档中常用的0912日期的某时段）
 * 这只是一个示例，方便演示。
 */
$(document).ready(function() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    // 格式化为HTML datetime-local input所需的格式 (YYYY-MM-DDThh:mm)
    const formatDate = (date) => date.toISOString().slice(0, 16);

    // 设置默认查询时间为昨天的一个小时区间
    $('#startTime').val(formatDate(new Date(yesterday.setHours(10, 0, 0, 0))));
    $('#endTime').val(formatDate(new Date(yesterday.setHours(11, 0, 0, 0))));
    $('#carStartTime').val(formatDate(new Date(yesterday.setHours(10, 0, 0, 0))));
    $('#carEndTime').val(formatDate(new Date(yesterday.setHours(11, 0, 0, 0))));

    // 【修改点2/1：页面加载完成后初始化百度地图】
    // 等待页面所有元素（包括地图容器）加载完毕后再初始化地图
    initBaiduMap();

    // 为“数据分析”按钮添加一个简单的点击确认（可选）
    $('#analysisForm').on('submit', function() {
        console.log('正在跳转到数据分析页面...');
        // 可以在这里添加一些预加载提示
    });
});