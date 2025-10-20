/**
 * 芯片数据实时接收系统 - 平台层模块
 * 负责数据处理、健康评估、异常检测和数据质量管理
 */

const platformLayer = (function() {
    // 私有变量
    const processedDataHistory = [];
    const anomalyLog = [];
    const healthHistory = [];
    
    // 配置参数
    const config = {
        // 正常数据范围
        normalRanges: {
            temperature: { min: 20, max: 30, unit: '°C' },
            voltage: { min: 3.2, max: 3.4, unit: 'G' },
            current: { min: 140, max: 160, unit: 'Z' },
            vibration: { min: 0, max: 0.1, unit: 'g' },
            displacement: { min: 0, max: 1.0, unit: 'mm' },
            tilt: { min: 0, max: 5.0, unit: '°' }
        },
        
        // 警告阈值
        warningThresholds: {
            temperature: { min: 18, max: 32 },
            voltage: { min: 3.0, max: 3.6 },
            current: { min: 120, max: 180 },
            vibration: { max: 0.08 },
            displacement: { max: 0.8 },
            tilt: { max: 4.0 }
        },
        
        // 异常阈值
        anomalyThresholds: {
            temperature: { min: 15, max: 35 },
            voltage: { min: 2.8, max: 3.8 },
            current: { min: 100, max: 200 },
            vibration: { max: 0.09 },
            displacement: { max: 0.9 },
            tilt: { max: 4.5 }
        },
        
        // 数据质量评估参数
        dataQualityParams: {
            completenessThreshold: 95,  // 数据完整性阈值(%)
            accuracyThreshold: 90,      // 数据准确性阈值(%)
            stabilityThreshold: 85      // 数据稳定性阈值(%)
        },
        
        // 健康评分计算权重
        healthScoreWeights: {
            temperature: 0.2,
            voltage: 0.2,
            current: 0.2,
            vibration: 0.15,
            displacement: 0.15,
            tilt: 0.1
        },
        
        // 历史数据保留数量
        historyLimit: 1000
    };
    
    // 初始化
    function initialize() {
        console.log('平台层模块已初始化');
    }
    
    // 接收数据并进行处理
    function receiveData(rawData) {
        // 验证数据完整性
        const isComplete = validateDataCompleteness(rawData);
        
        // 验证数据准确性
        const isAccurate = validateDataAccuracy(rawData);
        
        // 检测异常
        const anomalyResult = detectAnomaly(rawData);
        
        // 计算健康评分
        const healthScore = calculateHealthScore(rawData);
        
        // 确定健康状态
        const healthStatus = determineHealthStatus(healthScore);
        
        // 记录处理后的数据
        recordProcessedData(rawData, healthScore, anomalyResult);
        
        // 处理结果
        const result = {
            rawData: rawData,
            isComplete: isComplete,
            isAccurate: isAccurate,
            isAnomaly: anomalyResult.isAnomaly,
            anomalyReason: anomalyResult.reason,
            healthScore: healthScore,
            healthStatus: healthStatus
        };
        
        // 如果是异常数据，记录到异常日志
        if (anomalyResult.isAnomaly) {
            logAnomaly(rawData, anomalyResult.reason);
            
            // 触发异常事件
            triggerAnomalyEvent(rawData, anomalyResult.reason);
        }
        
        // 记录健康历史
        recordHealthHistory(healthScore);
        
        return result;
    }
    
    // 验证数据完整性
    function validateDataCompleteness(data) {
        const requiredFields = ['temperature', 'voltage', 'current', 'vibration', 'displacement', 'tilt'];
        
        for (const field of requiredFields) {
            if (data[field] === undefined || data[field] === null) {
                return false;
            }
        }
        
        return true;
    }
    
    // 验证数据准确性
    function validateDataAccuracy(data) {
        // 检查数据是否在合理范围内
        if (data.temperature < -50 || data.temperature > 150) return false;
        if (data.voltage < 0 || data.voltage > 10) return false;
        if (data.current < 0 || data.current > 1000) return false;
        if (data.vibration < 0 || data.vibration > 1) return false;
        if (data.displacement < 0 || data.displacement > 10) return false;
        if (data.tilt < 0 || data.tilt > 90) return false;
        
        // 检查数据是否有明显异常（如突变过大）
        if (processedDataHistory.length > 0) {
            const lastData = processedDataHistory[processedDataHistory.length - 1];
            
            // 温度变化不应超过5°C
            if (Math.abs(data.temperature - lastData.temperature) > 5) return false;
            
            // 电压变化不应超过0.5V
            if (Math.abs(data.voltage - lastData.voltage) > 0.5) return false;
            
            // 电流变化不应超过50Z
            if (Math.abs(data.current - lastData.current) > 50) return false;
            
            // 振动强度变化不应超过0.05g
            if (Math.abs(data.vibration - lastData.vibration) > 0.05) return false;
            
            // 位移变化不应超过0.5mm
            if (Math.abs(data.displacement - lastData.displacement) > 0.5) return false;
            
            // 倾斜角度变化不应超过2°
            if (Math.abs(data.tilt - lastData.tilt) > 2) return false;
        }
        
        return true;
    }
    
    // 检测异常
    function detectAnomaly(data) {
        const result = {
            isAnomaly: false,
            reason: ''
        };
        
        // 检查各指标是否超出异常阈值
        if (data.temperature < config.anomalyThresholds.temperature.min) {
            result.isAnomaly = true;
            result.reason = `温度过低 (${data.temperature.toFixed(1)}°C < ${config.anomalyThresholds.temperature.min}°C)`;
        } else if (data.temperature > config.anomalyThresholds.temperature.max) {
            result.isAnomaly = true;
            result.reason = `温度过高 (${data.temperature.toFixed(1)}°C > ${config.anomalyThresholds.temperature.max}°C)`;
        }
        
        if (data.voltage < config.anomalyThresholds.voltage.min) {
            result.isAnomaly = true;
            result.reason = `压力值过低 (${data.voltage.toFixed(2)}G < ${config.anomalyThresholds.voltage.min}G)`;
        } else if (data.voltage > config.anomalyThresholds.voltage.max) {
            result.isAnomaly = true;
            result.reason = `压力值过高 (${data.voltage.toFixed(2)}G > ${config.anomalyThresholds.voltage.max}G)`;
        }
        
        if (data.current < config.anomalyThresholds.current.min) {
            result.isAnomaly = true;
            result.reason = `震动程度过低 (${data.current.toFixed(1)}Z < ${config.anomalyThresholds.current.min}Z)`;
        } else if (data.current > config.anomalyThresholds.current.max) {
            result.isAnomaly = true;
            result.reason = `震动程度过高 (${data.current.toFixed(1)}Z > ${config.anomalyThresholds.current.max}Z)`;
        }
        
        if (data.vibration > config.anomalyThresholds.vibration.max) {
            result.isAnomaly = true;
            result.reason = `振动强度过高 (${data.vibration.toFixed(3)}g > ${config.anomalyThresholds.vibration.max}g)`;
        }
        
        if (data.displacement > config.anomalyThresholds.displacement.max) {
            result.isAnomaly = true;
            result.reason = `位移过大 (${data.displacement.toFixed(2)}mm > ${config.anomalyThresholds.displacement.max}mm)`;
        }
        
        if (data.tilt > config.anomalyThresholds.tilt.max) {
            result.isAnomaly = true;
            result.reason = `倾斜角度过大 (${data.tilt.toFixed(2)}° > ${config.anomalyThresholds.tilt.max}°)`;
        }
        
        return result;
    }
    
    // 计算健康评分
    function calculateHealthScore(data) {
        let score = 100;
        
        // 温度评分
        const tempScore = calculateMetricScore(
            data.temperature,
            config.normalRanges.temperature.min,
            config.normalRanges.temperature.max,
            config.anomalyThresholds.temperature.min,
            config.anomalyThresholds.temperature.max
        );
        score -= (100 - tempScore) * config.healthScoreWeights.temperature;
        
        // 电压评分
        const voltageScore = calculateMetricScore(
            data.voltage,
            config.normalRanges.voltage.min,
            config.normalRanges.voltage.max,
            config.anomalyThresholds.voltage.min,
            config.anomalyThresholds.voltage.max
        );
        score -= (100 - voltageScore) * config.healthScoreWeights.voltage;
        
        // 电流评分
        const currentScore = calculateMetricScore(
            data.current,
            config.normalRanges.current.min,
            config.normalRanges.current.max,
            config.anomalyThresholds.current.min,
            config.anomalyThresholds.current.max
        );
        score -= (100 - currentScore) * config.healthScoreWeights.current;
        
        // 振动强度评分
        const vibrationScore = calculateUpperBoundScore(
            data.vibration,
            config.normalRanges.vibration.max,
            config.anomalyThresholds.vibration.max
        );
        score -= (100 - vibrationScore) * config.healthScoreWeights.vibration;
        
        // 位移评分
        const displacementScore = calculateUpperBoundScore(
            data.displacement,
            config.normalRanges.displacement.max,
            config.anomalyThresholds.displacement.max
        );
        score -= (100 - displacementScore) * config.healthScoreWeights.displacement;
        
        // 倾斜角度评分
        const tiltScore = calculateUpperBoundScore(
            data.tilt,
            config.normalRanges.tilt.max,
            config.anomalyThresholds.tilt.max
        );
        score -= (100 - tiltScore) * config.healthScoreWeights.tilt;
        
        // 确保评分在0-100之间
        return Math.max(0, Math.min(100, Math.round(score)));
    }
    
    // 计算指标评分（适用于有上下限的指标）
    function calculateMetricScore(value, normalMin, normalMax, anomalyMin, anomalyMax) {
        // 如果在正常范围内，得100分
        if (value >= normalMin && value <= normalMax) {
            return 100;
        }
        
        // 如果在警告范围内，根据距离正常范围的距离计算分数
        if (value >= anomalyMin && value <= anomalyMax) {
            if (value < normalMin) {
                const range = normalMin - anomalyMin;
                const distance = normalMin - value;
                return 100 - (distance / range) * 100;
            } else {
                const range = anomalyMax - normalMax;
                const distance = value - normalMax;
                return 100 - (distance / range) * 100;
            }
        }
        
        // 如果在异常范围内，得0分
        return 0;
    }
    
    // 计算上限指标评分（适用于只有上限的指标）
    function calculateUpperBoundScore(value, normalMax, anomalyMax) {
        // 如果在正常范围内，得100分
        if (value <= normalMax) {
            return 100;
        }
        
        // 如果在警告范围内，根据距离正常范围的距离计算分数
        if (value <= anomalyMax) {
            const range = anomalyMax - normalMax;
            const distance = value - normalMax;
            return 100 - (distance / range) * 100;
        }
        
        // 如果在异常范围内，得0分
        return 0;
    }
    
    // 确定健康状态
    function determineHealthStatus(score) {
        if (score >= 90) {
            return {
                text: '优秀',
                color: 'bg-green-500'
            };
        } else if (score >= 80) {
            return {
                text: '良好',
                color: 'bg-green-400'
            };
        } else if (score >= 70) {
            return {
                text: '正常',
                color: 'bg-blue-400'
            };
        } else if (score >= 60) {
            return {
                text: '警告',
                color: 'bg-yellow-500'
            };
        } else {
            return {
                text: '危险',
                color: 'bg-red-500'
            };
        }
    }
    
    // 记录处理后的数据
    function recordProcessedData(data, healthScore, anomalyResult) {
        processedDataHistory.push({
            timestamp: data.timestamp || Date.now(),
            timeString: data.time || new Date().toLocaleTimeString(),
            data: data,
            healthScore: healthScore,
            isAnomaly: anomalyResult.isAnomaly,
            anomalyReason: anomalyResult.reason
        });
        
        // 限制历史数据数量
        if (processedDataHistory.length > config.historyLimit) {
            processedDataHistory.shift();
        }
    }
    
    // 记录健康历史
    function recordHealthHistory(score) {
        healthHistory.push({
            timestamp: Date.now(),
            score: score
        });
        
        // 限制历史数据数量
        if (healthHistory.length > config.historyLimit) {
            healthHistory.shift();
        }
    }
    
    // 记录异常日志
    function logAnomaly(data, reason) {
        anomalyLog.push({
            timestamp: data.timestamp || Date.now(),
            timeString: data.time || new Date().toLocaleTimeString(),
            data: data,
            reason: reason
        });
        
        // 限制异常日志数量
        if (anomalyLog.length > 1000) {
            anomalyLog.shift();
        }
    }
    
    // 触发异常事件
    function triggerAnomalyEvent(data, reason) {
        const event = new CustomEvent('platform.anomaly', {
            detail: {
                timestamp: data.timestamp || Date.now(),
                timeString: data.time || new Date().toLocaleTimeString(),
                data: data,
                reason: reason
            }
        });
        
        window.dispatchEvent(event);
    }
    
    // 生成健康评估报告
    function generateHealthReport() {
        // 如果没有足够的数据，返回空报告
        if (processedDataHistory.length < 10) {
            return {
                timeString: new Date().toLocaleString(),
                duration: '不足',
                healthScore: {
                    current: 0,
                    average: 0,
                    trend: 0,
                    status: { text: '数据不足', color: 'bg-gray-500' }
                },
                anomalyStats: {
                    count: 0,
                    rate: 0
                },
                keyMetrics: {},
                issues: ['数据不足，无法生成健康评估报告'],
                recommendations: ['请收集更多数据后再试']
            };
        }
        
        // 计算健康评分统计
        const healthScores = processedDataHistory.map(item => item.healthScore);
        const currentHealthScore = healthScores[healthScores.length - 1];
        const avgHealthScore = healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length;
        
        // 计算健康趋势（最近10个数据点的变化率）
        let healthTrend = 0;
        if (healthScores.length >= 10) {
            const recentScores = healthScores.slice(-10);
            const firstScore = recentScores[0];
            const lastScore = recentScores[recentScores.length - 1];
            const timeDiff = (processedDataHistory[processedDataHistory.length - 1].timestamp - 
                              processedDataHistory[processedDataHistory.length - 10].timestamp) / 60000; // 转换为分钟
            
            if (timeDiff > 0) {
                healthTrend = ((lastScore - firstScore) / timeDiff).toFixed(2);
            }
        }
        
        // 确定健康状态
        const healthStatus = determineHealthStatus(currentHealthScore);
        
        // 计算异常统计
        const anomalyCount = anomalyLog.length;
        const anomalyRate = (anomalyCount / processedDataHistory.length * 100).toFixed(2);
        
        // 计算关键指标统计
        const keyMetrics = calculateKeyMetrics();
        
        // 检测问题
        const issues = detectIssues(keyMetrics);
        
        // 生成建议
        const recommendations = generateRecommendations(issues);
        
        // 确定分析期间
        const startTime = new Date(processedDataHistory[0].timestamp);
        const endTime = new Date(processedDataHistory[processedDataHistory.length - 1].timestamp);
        const durationMinutes = Math.round((endTime - startTime) / 60000);
        const duration = durationMinutes < 60 ? 
            `${durationMinutes}分钟` : 
            `${Math.floor(durationMinutes / 60)}小时${durationMinutes % 60}分钟`;
        
        return {
            timeString: new Date().toLocaleString(),
            duration: duration,
            healthScore: {
                current: currentHealthScore,
                average: avgHealthScore,
                trend: healthTrend,
                status: healthStatus
            },
            anomalyStats: {
                count: anomalyCount,
                rate: anomalyRate
            },
            keyMetrics: keyMetrics,
            issues: issues,
            recommendations: recommendations
        };
    }
    
    // 计算关键指标统计
    function calculateKeyMetrics() {
        // 如果没有足够的数据，返回空对象
        if (processedDataHistory.length === 0) {
            return {};
        }
        
        // 提取各指标数据
        const temperatures = processedDataHistory.map(item => item.data.temperature);
        const voltages = processedDataHistory.map(item => item.data.voltage);
        const currents = processedDataHistory.map(item => item.data.current);
        const vibrations = processedDataHistory.map(item => item.data.vibration);
        const displacements = processedDataHistory.map(item => item.data.displacement);
        const tilts = processedDataHistory.map(item => item.data.tilt);
        
        return {
            temperature: {
                mean: calculateMean(temperatures).toFixed(1),
                stdDev: calculateStandardDeviation(temperatures).toFixed(2),
                min: Math.min(...temperatures).toFixed(1),
                max: Math.max(...temperatures).toFixed(1),
                unit: config.normalRanges.temperature.unit
            },
            voltage: {
                mean: calculateMean(voltages).toFixed(2),
                stdDev: calculateStandardDeviation(voltages).toFixed(3),
                min: Math.min(...voltages).toFixed(2),
                max: Math.max(...voltages).toFixed(2),
                unit: config.normalRanges.voltage.unit
            },
            current: {
                mean: calculateMean(currents).toFixed(1),
                stdDev: calculateStandardDeviation(currents).toFixed(2),
                min: Math.min(...currents).toFixed(1),
                max: Math.max(...currents).toFixed(1),
                unit: config.normalRanges.current.unit
            },
            vibration: {
                mean: calculateMean(vibrations).toFixed(3),
                stdDev: calculateStandardDeviation(vibrations).toFixed(4),
                min: Math.min(...vibrations).toFixed(3),
                max: Math.max(...vibrations).toFixed(3),
                unit: config.normalRanges.vibration.unit
            },
            displacement: {
                mean: calculateMean(displacements).toFixed(2),
                stdDev: calculateStandardDeviation(displacements).toFixed(3),
                min: Math.min(...displacements).toFixed(2),
                max: Math.max(...displacements).toFixed(2),
                unit: config.normalRanges.displacement.unit
            },
            tilt: {
                mean: calculateMean(tilts).toFixed(2),
                stdDev: calculateStandardDeviation(tilts).toFixed(3),
                min: Math.min(...tilts).toFixed(2),
                max: Math.max(...tilts).toFixed(2),
                unit: config.normalRanges.tilt.unit
            }
        };
    }
    
    // 检测问题
    function detectIssues(keyMetrics) {
        const issues = [];
        
        // 检查温度
        if (keyMetrics.temperature) {
            const tempMean = parseFloat(keyMetrics.temperature.mean);
            if (tempMean < config.warningThresholds.temperature.min) {
                issues.push(`温度偏低，平均值为 ${tempMean}°C，低于警告阈值 ${config.warningThresholds.temperature.min}°C`);
            } else if (tempMean > config.warningThresholds.temperature.max) {
                issues.push(`温度偏高，平均值为 ${tempMean}°C，高于警告阈值 ${config.warningThresholds.temperature.max}°C`);
            }
        }
        
        // 检查电压
        if (keyMetrics.voltage) {
            const voltageMean = parseFloat(keyMetrics.voltage.mean);
            if (voltageMean < config.warningThresholds.voltage.min) {
                issues.push(`压力值偏低，平均值为 ${voltageMean}G，低于警告阈值 ${config.warningThresholds.voltage.min}G`);
            } else if (voltageMean > config.warningThresholds.voltage.max) {
                issues.push(`压力值偏高，平均值为 ${voltageMean}G，高于警告阈值 ${config.warningThresholds.voltage.max}G`);
            }
        }
        
        // 检查电流
        if (keyMetrics.current) {
            const currentMean = parseFloat(keyMetrics.current.mean);
            if (currentMean < config.warningThresholds.current.min) {
                issues.push(`震动程度偏低，平均值为 ${currentMean}Z，低于警告阈值 ${config.warningThresholds.current.min}Z`);
            } else if (currentMean > config.warningThresholds.current.max) {
                issues.push(`震动程度偏高，平均值为 ${currentMean}Z，高于警告阈值 ${config.warningThresholds.current.max}Z`);
            }
        }
        
        // 检查振动强度
        if (keyMetrics.vibration) {
            const vibrationMean = parseFloat(keyMetrics.vibration.mean);
            if (vibrationMean > config.warningThresholds.vibration.max) {
                issues.push(`振动强度偏高，平均值为 ${vibrationMean}g，高于警告阈值 ${config.warningThresholds.vibration.max}g`);
            }
        }
        
        // 检查位移
        if (keyMetrics.displacement) {
            const displacementMean = parseFloat(keyMetrics.displacement.mean);
            if (displacementMean > config.warningThresholds.displacement.max) {
                issues.push(`位移偏大，平均值为 ${displacementMean}mm，高于警告阈值 ${config.warningThresholds.displacement.max}mm`);
            }
        }
        
        // 检查倾斜角度
        if (keyMetrics.tilt) {
            const tiltMean = parseFloat(keyMetrics.tilt.mean);
            if (tiltMean > config.warningThresholds.tilt.max) {
                issues.push(`倾斜角度偏大，平均值为 ${tiltMean}°，高于警告阈值 ${config.warningThresholds.tilt.max}°`);
            }
        }
        
        // 检查异常率
        const anomalyRate = (anomalyLog.length / processedDataHistory.length * 100).toFixed(2);
        if (parseFloat(anomalyRate) > 5) {
            issues.push(`异常率偏高，达到 ${anomalyRate}%，超过5%的阈值`);
        }
        
        // 检查健康评分
        const healthReport = generateHealthReport();
        if (healthReport.healthScore.current < 80) {
            issues.push(`当前健康评分较低，为 ${healthReport.healthScore.current}/100，建议检查系统状态`);
        }
        
        // 检查健康趋势
        if (healthReport.healthScore.trend < -0.5) {
            issues.push(`健康评分呈下降趋势，每分钟下降 ${Math.abs(healthReport.healthScore.trend)} 分，建议密切关注`);
        }
        
        return issues;
    }
    
    // 生成建议
    function generateRecommendations(issues) {
        const recommendations = [];
        
        if (issues.length === 0) {
            recommendations.push('系统运行正常，建议保持当前监控频率，定期生成健康评估报告以跟踪系统状态变化。');
            return recommendations;
        }
        
        // 根据问题生成建议
        for (const issue of issues) {
            if (issue.includes('温度偏低')) {
                recommendations.push('检查温度传感器是否正常工作，确保设备处于适宜的工作环境温度范围内。');
            } else if (issue.includes('温度偏高')) {
                recommendations.push('检查散热系统是否正常工作，确保设备通风良好，必要时增加散热措施。');
            } else if (issue.includes('压力值偏低')) {
                recommendations.push('检查压力传感器是否正常工作，确保设备供电稳定。');
            } else if (issue.includes('压力值偏高')) {
                recommendations.push('检查压力传感器是否正常工作，确保设备不会因过压而损坏。');
            } else if (issue.includes('震动程度偏低')) {
                recommendations.push('检查震动传感器是否正常工作，确保传感器安装牢固。');
            } else if (issue.includes('震动程度偏高')) {
                recommendations.push('检查设备是否安装牢固，必要时增加减震措施，减少外部干扰。');
            } else if (issue.includes('振动强度偏高')) {
                recommendations.push('检查建筑结构是否稳定，必要时进行结构加固，减少振动源。');
            } else if (issue.includes('位移偏大')) {
                recommendations.push('检查建筑基础是否稳定，必要时进行地基加固或调整设备安装位置。');
            } else if (issue.includes('倾斜角度偏大')) {
                recommendations.push('检查建筑结构是否存在倾斜风险，必要时进行结构调整或加固。');
            } else if (issue.includes('异常率偏高')) {
                recommendations.push('检查传感器是否正常工作，数据传输是否稳定，必要时更换故障设备。');
            } else if (issue.includes('健康评分较低')) {
                recommendations.push('全面检查系统各组件，识别并解决潜在问题，提高系统整体健康水平。');
            } else if (issue.includes('健康评分呈下降趋势')) {
                recommendations.push('增加监控频率，密切关注系统状态变化，及时采取措施防止问题恶化。');
            }
        }
        
        // 添加通用建议
        recommendations.push('定期生成健康评估报告，跟踪系统状态变化趋势，建立预防性维护机制。');
        
        return recommendations;
    }
    
    // 生成数据质量报告
    function generateDataQualityReport() {
        // 如果没有足够的数据，返回空报告
        if (processedDataHistory.length < 10) {
            return {
                dataQualityScore: 0,
                qualityLevel: {
                    name: '数据不足',
                    color: 'bg-gray-500'
                },
                metrics: {},
                recommendations: ['数据不足，无法生成数据质量报告']
            };
        }
        
        // 计算数据完整性
        const completeness = calculateDataCompleteness();
        
        // 计算数据准确性
        const accuracy = calculateDataAccuracy();
        
        // 计算数据稳定性
        const stability = calculateDataStability();
        
        // 计算数据质量总分
        const dataQualityScore = Math.round((completeness.score + accuracy.score + stability.score) / 3);
        
        // 确定数据质量等级
        let qualityLevel;
        if (dataQualityScore >= 90) {
            qualityLevel = {
                name: '优秀',
                color: 'bg-green-500'
            };
        } else if (dataQualityScore >= 80) {
            qualityLevel = {
                name: '良好',
                color: 'bg-green-400'
            };
        } else if (dataQualityScore >= 70) {
            qualityLevel = {
                name: '一般',
                color: 'bg-blue-400'
            };
        } else if (dataQualityScore >= 60) {
            qualityLevel = {
                name: '较差',
                color: 'bg-yellow-500'
            };
        } else {
            qualityLevel = {
                name: '差',
                color: 'bg-red-500'
            };
        }
        
        // 生成建议
        const recommendations = generateDataQualityRecommendations(completeness, accuracy, stability);
        
        return {
            dataQualityScore: dataQualityScore,
            qualityLevel: qualityLevel,
            metrics: {
                completeness: completeness,
                accuracy: accuracy,
                stability: stability
            },
            recommendations: recommendations
        };
    }
    
    // 计算数据完整性
    function calculateDataCompleteness() {
        // 如果没有数据，返回0
        if (processedDataHistory.length === 0) {
            return {
                value: '0%',
                score: 0
            };
        }
        
        // 检查每个数据点是否完整
        let completeCount = 0;
        const requiredFields = ['temperature', 'voltage', 'current', 'vibration', 'displacement', 'tilt'];
        
        for (const item of processedDataHistory) {
            let isComplete = true;
            
            for (const field of requiredFields) {
                if (item.data[field] === undefined || item.data[field] === null) {
                    isComplete = false;
                    break;
                }
            }
            
            if (isComplete) {
                completeCount++;
            }
        }
        
        // 计算完整性百分比
        const completenessPercentage = (completeCount / processedDataHistory.length * 100).toFixed(1);
        const score = Math.min(100, Math.max(0, Math.round(completenessPercentage)));
        
        return {
            value: `${completenessPercentage}%`,
            score: score
        };
    }
    
    // 计算数据准确性
    function calculateDataAccuracy() {
        // 如果没有数据，返回0
        if (processedDataHistory.length === 0) {
            return {
                value: '0%',
                score: 0
            };
        }
        
        // 检查每个数据点是否准确
        let accurateCount = 0;
        
        for (const item of processedDataHistory) {
            if (validateDataAccuracy(item.data)) {
                accurateCount++;
            }
        }
        
        // 计算准确性百分比
        const accuracyPercentage = (accurateCount / processedDataHistory.length * 100).toFixed(1);
        const score = Math.min(100, Math.max(0, Math.round(accuracyPercentage)));
        
        return {
            value: `${accuracyPercentage}%`,
            score: score
        };
    }
    
    // 计算数据稳定性
    function calculateDataStability() {
        // 如果没有足够的数据，返回0
        if (processedDataHistory.length < 10) {
            return {
                value: '0%',
                score: 0
            };
        }
        
        // 计算各指标的变异系数（标准差/平均值）
        const temperatures = processedDataHistory.map(item => item.data.temperature);
        const voltages = processedDataHistory.map(item => item.data.voltage);
        const currents = processedDataHistory.map(item => item.data.current);
        const vibrations = processedDataHistory.map(item => item.data.vibration);
        const displacements = processedDataHistory.map(item => item.data.displacement);
        const tilts = processedDataHistory.map(item => item.data.tilt);
        
        const tempCV = calculateCoefficientOfVariation(temperatures);
        const voltageCV = calculateCoefficientOfVariation(voltages);
        const currentCV = calculateCoefficientOfVariation(currents);
        const vibrationCV = calculateCoefficientOfVariation(vibrations);
        const displacementCV = calculateCoefficientOfVariation(displacements);
        const tiltCV = calculateCoefficientOfVariation(tilts);
        
        // 计算平均变异系数
        const avgCV = (tempCV + voltageCV + currentCV + vibrationCV + displacementCV + tiltCV) / 6;
        
        // 将变异系数转换为稳定性分数（变异系数越小，稳定性越高）
        // 假设变异系数的合理范围是0-0.1，超过0.1则稳定性较差
        const maxCV = 0.1;
        let stabilityScore = Math.round((1 - Math.min(avgCV / maxCV, 1)) * 100);
        
        // 确保分数在0-100之间
        stabilityScore = Math.max(0, Math.min(100, stabilityScore));
        
        // 转换为百分比形式
        const stabilityPercentage = (stabilityScore).toFixed(1);
        
        return {
            value: `${stabilityPercentage}%`,
            score: stabilityScore
        };
    }
    
    // 生成数据质量建议
    function generateDataQualityRecommendations(completeness, accuracy, stability) {
        const recommendations = [];
        
        // 检查数据完整性
        if (completeness.score < config.dataQualityParams.completenessThreshold) {
            recommendations.push(`数据完整性较低(${completeness.value})，建议检查传感器连接是否稳定，数据采集程序是否正常运行，确保所有必要数据字段都能正确采集。`);
        }
        
        // 检查数据准确性
        if (accuracy.score < config.dataQualityParams.accuracyThreshold) {
            recommendations.push(`数据准确性较低(${accuracy.value})，建议校准传感器，检查数据传输过程中是否存在干扰，确保采集的数据能够准确反映实际情况。`);
        }
        
        // 检查数据稳定性
        if (stability.score < config.dataQualityParams.stabilityThreshold) {
            recommendations.push(`数据稳定性较低(${stability.value})，建议检查传感器安装是否牢固，环境是否存在较大波动，必要时调整采样频率或增加滤波算法。`);
        }
        
        // 如果所有指标都达标
        if (completeness.score >= config.dataQualityParams.completenessThreshold &&
            accuracy.score >= config.dataQualityParams.accuracyThreshold &&
            stability.score >= config.dataQualityParams.stabilityThreshold) {
            recommendations.push('数据质量良好，所有指标均达到要求，建议保持当前的数据采集和处理策略。');
        }
        
        return recommendations;
    }
    
    // 获取异常日志
    function getAnomalyLog(limit = 100) {
        // 返回最近的N条异常日志
        return [...anomalyLog].reverse().slice(0, limit);
    }
    
    // 获取健康历史
    function getHealthHistory(limit = 100) {
        // 返回最近的N条健康历史记录
        return [...healthHistory].reverse().slice(0, limit);
    }
    
    // 获取处理后的数据历史
    function getProcessedDataHistory(limit = 100) {
        // 返回最近的N条处理后的数据
        return [...processedDataHistory].reverse().slice(0, limit);
    }
    
    // 辅助函数：计算平均值
    function calculateMean(values) {
        if (values.length === 0) return 0;
        return values.reduce((sum, value) => sum + value, 0) / values.length;
    }
    
    // 辅助函数：计算标准差
    function calculateStandardDeviation(values) {
        if (values.length === 0) return 0;
        
        const mean = calculateMean(values);
        const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
        const variance = calculateMean(squaredDifferences);
        
        return Math.sqrt(variance);
    }
    
    // 辅助函数：计算变异系数（标准差/平均值）
    function calculateCoefficientOfVariation(values) {
        if (values.length === 0) return 0;
        
        const mean = calculateMean(values);
        if (mean === 0) return 0;
        
        const stdDev = calculateStandardDeviation(values);
        
        return stdDev / mean;
    }
    
    // 初始化平台层
    initialize();
    
    // 暴露公共方法
    return {
        receiveData: receiveData,
        generateHealthReport: generateHealthReport,
        generateDataQualityReport: generateDataQualityReport,
        getAnomalyLog: getAnomalyLog,
        getHealthHistory: getHealthHistory,
        getProcessedDataHistory: getProcessedDataHistory,
        config: config
    };
})();
