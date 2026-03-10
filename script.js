// script.js
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
                $('#mainMapFrame').attr('src', response.map_url);
                $('#map-title').text('时间段车辆分布查询结果');
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
                $('#mainMapFrame').attr('src', response.map_url);
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

    // 为“数据分析”按钮添加一个简单的点击确认（可选）
    $('#analysisForm').on('submit', function() {
        console.log('正在跳转到数据分析页面...');
        // 可以在这里添加一些预加载提示
    });
});