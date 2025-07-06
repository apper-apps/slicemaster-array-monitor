// GIF Worker - Handles GIF generation in a separate thread
// This prevents UI blocking during intensive GIF processing

// Declare worker globals
/* global self, importScripts, GIF */

// Import GIF.js library
importScripts('https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.js');

// Worker message handler
self.onmessage = function(event) {
    const { type, data } = event.data;
    
    try {
        switch (type) {
            case 'CREATE_GIF':
                createGif(data);
                break;
            case 'ADD_FRAME':
                addFrame(data);
                break;
            case 'RENDER_GIF':
                renderGif(data);
                break;
            default:
                throw new Error(`Unknown message type: ${type}`);
        }
    } catch (error) {
        self.postMessage({
            type: 'ERROR',
            error: error.message || 'Unknown error occurred'
        });
    }
};

let gif = null;

function createGif(options = {}) {
    try {
        // Create new GIF instance with options
        gif = new GIF({
            workers: 2,
            quality: options.quality || 10,
            width: options.width || 400,
            height: options.height || 300,
            repeat: options.repeat !== undefined ? options.repeat : 0,
            transparent: options.transparent || null,
            background: options.background || '#ffffff',
            ...options
        });

        // Set up progress handler
        gif.on('progress', function(p) {
            self.postMessage({
                type: 'PROGRESS',
                progress: p
            });
        });

        // Set up finished handler
        gif.on('finished', function(blob) {
            self.postMessage({
                type: 'FINISHED',
                blob: blob
            });
        });

        self.postMessage({
            type: 'GIF_CREATED',
            success: true
        });

    } catch (error) {
        self.postMessage({
            type: 'ERROR',
            error: `Failed to create GIF: ${error.message}`
        });
    }
}

function addFrame(frameData) {
    try {
        if (!gif) {
            throw new Error('GIF not initialized. Call CREATE_GIF first.');
        }

        const { canvas, delay, copy } = frameData;
        
        // Add frame to GIF
        gif.addFrame(canvas, {
            delay: delay || 500,
            copy: copy !== undefined ? copy : false
        });

        self.postMessage({
            type: 'FRAME_ADDED',
            success: true
        });

    } catch (error) {
        self.postMessage({
            type: 'ERROR',
            error: `Failed to add frame: ${error.message}`
        });
    }
}

function renderGif(options = {}) {
    try {
        if (!gif) {
            throw new Error('GIF not initialized. Call CREATE_GIF first.');
        }

        // Start rendering
        gif.render();

        self.postMessage({
            type: 'RENDER_STARTED',
            success: true
        });

    } catch (error) {
        self.postMessage({
            type: 'ERROR',
            error: `Failed to render GIF: ${error.message}`
        });
    }
}

// Handle worker errors
self.onerror = function(error) {
    self.postMessage({
        type: 'ERROR',
        error: `Worker error: ${error.message}`
    });
};

// Handle unhandled promise rejections
self.onunhandledrejection = function(event) {
    self.postMessage({
        type: 'ERROR',
        error: `Unhandled promise rejection: ${event.reason}`
    });
};

// Send ready message
self.postMessage({
    type: 'READY',
    message: 'GIF Worker initialized successfully'
});