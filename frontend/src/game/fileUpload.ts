export interface FileValidationResult {
    isValid: boolean;
    error?: string;
    file?: File;
}

export class FileUploadHelper {
    private static readonly MAX_SIZE_MB = 5;
    private static readonly ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];  // ✅ Add types

    /**
     * Validate PNG file for upload
     */
    static validateImageFile(file: File): FileValidationResult {
        // 1. Check if file exists
        if (!file) {
            return {
                isValid: false,
                error: 'No file selected'
            };
        }

        // 2. Check file size (5MB max)
        const maxSizeInBytes = this.MAX_SIZE_MB * 1024 * 1024;
        if (file.size > maxSizeInBytes) {
            return {
                isValid: false,
                error: `File too large. Maximum size: ${this.MAX_SIZE_MB}MB (Your file: ${(file.size / 1024 / 1024).toFixed(2)}MB)`
            };
        }

        // 3. Check MIME type (multiple allowed)
        if (!this.ALLOWED_TYPES.includes(file.type)) {
            return {
                isValid: false,
                error: `Invalid file type. Allowed types: ${this.ALLOWED_TYPES.join(', ')} (Got: ${file.type})`
            };
        }

        // 4. Check file extension
        const validExtensions = ['.png', '.jpg', '.jpeg'];
        const hasValidExt = validExtensions.some(ext => 
            file.name.toLowerCase().endsWith(ext)
        );

        if (!hasValidExt) {
            return {
                isValid: false,
                error: `File must have one of these extensions: ${validExtensions.join(', ')}`
            };
        }

        //All checks passed
        return {
            isValid: true,
            file
        };
    }

    /**
     * Create a preview URL for an image
     */
    static createPreviewUrl(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                resolve(e.target?.result as string);
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsDataURL(file);
        });
    }
}