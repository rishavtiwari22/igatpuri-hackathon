import { computeMSSSIM } from '../utils/imageComparison';

// Enhanced comparison handler using ONLY local MS-SSIM (no API fallback)
const handleComparison = async (AIGeneratedimg, selectedImage) => {
    if (!AIGeneratedimg || !selectedImage) {
        const errorResult = { 
            error: "Please generate and select an image first", 
            combined: 0,
            method: "validation_error"
        };
        console.error("❌ Missing images for comparison");
        return errorResult;
    }

    // Track performance metrics as per project specifications
    const startTime = Date.now();
    
    try {
        // ONLY METHOD: Local MS-SSIM comparison
        const localResult = await attemptLocalComparison(AIGeneratedimg, selectedImage);
        
        if (localResult.success) {
            const duration = Date.now() - startTime;
            
            // Log analytics data for UX improvements
            logAnalytics('comparison_success', {
                method: 'local_ms_ssim_only',
                duration,
                score: localResult.result.percentage,
                detailed_scores: localResult.result.detailed_scores
            });
            
            const finalResult = {
                ...localResult.result,
                method: 'local_ms_ssim_only',
                performance: { duration, timestamp: new Date().toISOString() }
            };
            
            return finalResult;
        }
        
        // If local MS-SSIM fails, return error (no API fallback)
        console.error("❌ Local MS-SSIM comparison failed");
        
        // Return error result with detailed information about the failure
        const duration = Date.now() - startTime;
        
        logAnalytics('comparison_local_failure', {
            method: 'local_ms_ssim_only',
            duration,
            error: localResult.error
        });
        
        return {
            error: `MS-SSIM comparison failed: ${localResult.error}`,
            combined: 0,
            method: 'local_ms_ssim_failed',
            performance: { duration, timestamp: new Date().toISOString() },
            failure_reason: localResult.error
        };
        
    } catch (unexpectedError) {
        const duration = Date.now() - startTime;
        console.error("💥 Unexpected error in MS-SSIM comparison system:", unexpectedError);
        
        logAnalytics('comparison_critical_error', {
            error: unexpectedError.message,
            duration,
            method: 'local_ms_ssim_only'
        });
        
        return {
            error: `Critical MS-SSIM comparison error: ${unexpectedError.message}`,
            combined: 0,
            method: 'critical_failure',
            performance: { duration, timestamp: new Date().toISOString() }
        };
    }
};

// Analytics helper function for user behavior tracking
const logAnalytics = (event, data) => {
    try {
        // Store analytics data for UX improvements as per project requirements
        const analyticsData = {
            timestamp: new Date().toISOString(),
            event,
            data,
            userAgent: navigator.userAgent,
            sessionId: sessionStorage.getItem('sessionId') || crypto.randomUUID()
        };
        
        // Store in localStorage for analysis
        const existingData = JSON.parse(localStorage.getItem('imageComparisonAnalytics') || '[]');
        existingData.push(analyticsData);
        
        // Keep only last 100 entries to prevent storage bloat
        if (existingData.length > 100) {
            existingData.splice(0, existingData.length - 100);
        }
        
        localStorage.setItem('imageComparisonAnalytics', JSON.stringify(existingData));
    } catch (error) {
        console.warn('Analytics logging failed:', error);
    }
};

// Attempt local MS-SSIM comparison (primary method)
const attemptLocalComparison = async (AIGeneratedimg, selectedImage) => {
    try {
        // Validate image sources
        if (!AIGeneratedimg || !selectedImage) {
            throw new Error('Missing image sources for local comparison');
        }
        
        // Use the enhanced MS-SSIM algorithm with 5 scales for maximum accuracy
        const result = await computeMSSSIM(selectedImage, AIGeneratedimg, 5);
        
        if (!result) {
            throw new Error('MS-SSIM computation returned null/undefined');
        }
        
        if (result.error) {
            throw new Error(result.error);
        }
        
        // Validate result structure
        if (typeof result.percentage !== 'number' || isNaN(result.percentage)) {
            console.error('Invalid result structure:', result);
            throw new Error('Invalid MS-SSIM result structure - missing or invalid percentage');
        }
        
        // Additional validation for minimum score threshold
        if (result.percentage < 0 || result.percentage > 100) {
            console.error('Invalid percentage range:', result.percentage);
            throw new Error(`MS-SSIM result out of valid range (0-100): ${result.percentage}`);
        }
        
        // Enhance the result with additional metadata - flatten structure for easier access
        const enhancedResult = {
            ...result,
            combined: result.percentage / 100, // Convert to 0-1 scale for consistency
            percentage: result.percentage,
            detailed_scores: result.detailed_scores || {},
            ms_ssim: result.ms_ssim || (result.percentage / 100),
            algorithm: 'Enhanced_MS_SSIM_v2.2',
            analysis: result.analysis || {},
            per_scale_scores: result.per_scale_scores || [],
            method: 'local_ms_ssim',
            accuracy_level: 'high',
            algorithm_version: '2.2'
        };
        
        return { success: true, result: enhancedResult };
        
    } catch (error) {
        console.error('⚠️ Local MS-SSIM comparison failed:', error);
        console.error('Error stack:', error.stack);
        
        return { 
            success: false, 
            error: `Local comparison failed: ${error.message}`,
            method: 'local_ms_ssim',
            debug_details: {
                AIGeneratedimg_type: typeof AIGeneratedimg,
                selectedImage_type: typeof selectedImage,
                error_message: error.message,
                error_stack: error.stack
            }
        };
    }
};

export default handleComparison;