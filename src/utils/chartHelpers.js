/**
 * Chart utility functions and configurations for ECharts
 */

/**
 * Generates an array of dates for the past N days
 * @param {number} days - Number of days to generate (default: 30)
 * @param {string} format - Date format: 'short' or 'full' (default: 'short')
 * @returns {Array<string>} - Array of formatted date strings
 */
export const generateDateLabels = (days = 30, format = 'short') => {
    const dates = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        if (format === 'full') {
            dates.push(date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }));
        } else {
            dates.push(date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            }));
        }
    }

    return dates;
};

/**
 * Creates a line chart configuration for ECharts
 * @param {Object} options - Chart configuration options
 * @param {Array<string>} options.xAxisData - X-axis labels
 * @param {Array<number>} options.seriesData - Series data values
 * @param {string} options.seriesName - Name of the series (default: 'Data')
 * @param {string} options.yAxisName - Y-axis label (default: 'Value')
 * @param {boolean} options.smooth - Whether to smooth the line (default: true)
 * @param {boolean} options.showArea - Whether to show area under line (default: true)
 * @param {number} options.lineWidth - Line width (default: 3)
 * @param {number} options.areaOpacity - Area opacity 0-1 (default: 0.3)
 * @param {boolean} options.showSymbol - Whether to show data points (default: false)
 * @param {Object} options.visualMap - Visual map configuration for gradient
 * @returns {Object} - ECharts option configuration
 */
export const createLineChartConfig = ({
    xAxisData,
    seriesData,
    seriesName = 'Data',
    yAxisName = 'Value',
    smooth = true,
    showArea = true,
    lineWidth = 3,
    areaOpacity = 0.3,
    showSymbol = false,
    visualMap = null
}) => {
    const config = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross'
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: xAxisData
        },
        yAxis: {
            type: 'value',
            name: yAxisName
        },
        series: [
            {
                name: seriesName,
                type: 'line',
                smooth,
                showSymbol,
                lineStyle: {
                    width: lineWidth
                },
                data: seriesData
            }
        ]
    };

    // Add area style if enabled
    if (showArea) {
        config.series[0].areaStyle = {
            opacity: areaOpacity
        };
    }

    // Add visual map for gradient if provided
    if (visualMap) {
        config.visualMap = {
            show: false,
            type: 'continuous',
            seriesIndex: 0,
            ...visualMap
        };
    }

    return config;
};

/**
 * Creates a donut (pie with inner radius) chart configuration for ECharts
 * @param {Object} options
 * @param {Array} options.data - Array of { name, value, itemStyle: { color } }
 * @param {string} options.title - Series name shown in tooltip
 */
export const createDonutChartConfig = ({ data, title = '' }) => ({
    tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
    },
    legend: {
        orient: 'vertical',
        left: 'left',
        top: 'center',
        textStyle: { fontSize: 12 }
    },
    series: [{
        name: title,
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['65%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
        labelLine: { show: false },
        data
    }]
});

/**
 * Creates a horizontal bar chart configuration for ECharts
 * @param {Object} options
 * @param {Array<string>} options.categories - Y-axis category labels
 * @param {Array<number>} options.values - Bar values
 * @param {Array<string>} options.colors - Per-bar colors
 */
export const createHorizontalBarChartConfig = ({ categories, values, colors = [] }) => ({
    tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
    },
    grid: { left: '3%', right: '10%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: categories },
    series: [{
        type: 'bar',
        barMaxWidth: 36,
        data: values.map((v, i) => ({
            value: v,
            itemStyle: {
                color: colors[i] || '#6366f1',
                borderRadius: [0, 4, 4, 0]
            }
        }))
    }]
});

/**
 * Creates a multi-line chart configuration
 * @param {Object} options - Chart configuration options
 * @param {Array<string>} options.xAxisData - X-axis labels
 * @param {Array<Object>} options.seriesConfig - Array of series configurations
 * @param {string} options.yAxisName - Y-axis label
 * @returns {Object} - ECharts option configuration
 */
export const createMultiLineChartConfig = ({
    xAxisData,
    seriesConfig,
    yAxisName = 'Value'
}) => {
    return {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross'
            }
        },
        legend: {
            data: seriesConfig.map(s => s.name)
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: xAxisData
        },
        yAxis: {
            type: 'value',
            name: yAxisName
        },
        series: seriesConfig.map(series => ({
            name: series.name,
            type: 'line',
            smooth: series.smooth !== undefined ? series.smooth : true,
            showSymbol: series.showSymbol !== undefined ? series.showSymbol : false,
            lineStyle: {
                width: series.lineWidth || 2
            },
            areaStyle: series.showArea ? {
                opacity: series.areaOpacity || 0.2
            } : undefined,
            data: series.data
        }))
    };
};
