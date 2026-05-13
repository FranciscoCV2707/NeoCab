#!/bin/bash

# NeoCab v3.0 - Master Build Script
# Builds for all platforms: Windows NSIS, Linux AppImage (x64), Linux AppImage (ARM)
# Usage: ./build-all.sh [version] [platform] [arm_arch]
# Platforms: all, windows, linux, linux-arm
# ARM architectures: armv7 (default), aarch64

set -e

VERSION="${1:-3.0.0}"
PLATFORM="${2:-all}"
ARM_ARCH="${3:-armv7}"
OUTPUT_DIR="./dist"

echo "================================================"
echo "NeoCab v3.0 - Multi-Platform Builder"
echo "Version: $VERSION"
echo "Platform: $PLATFORM"
if [[ "$PLATFORM" == "all" || "$PLATFORM" == "linux-arm" ]]; then
    echo "ARM Architecture: $ARM_ARCH"
fi
echo "================================================"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# Build Rust backend
echo "================================"
print_info "Building Rust backend..."
echo "================================"

cd src-tauri

if [ -z "$CARGO_TARGET_DIR" ]; then
    CARGO_TARGET_DIR="./target"
fi

cargo build --release || {
    print_error "Cargo build failed"
    exit 1
}

print_status "Rust backend built"

cd ..

# Platform detection
if [[ "$PLATFORM" == "all" || "$PLATFORM" == "windows" ]]; then
    echo "================================"
    print_info "Building Windows NSIS installer..."
    echo "================================"

    if command -v pwsh &> /dev/null; then
        pwsh -File "./build-scripts/build-nsis.ps1" -version $VERSION -outputDir $OUTPUT_DIR
        print_status "Windows installer built"
    else
        print_error "PowerShell not found. Skipping Windows build."
    fi
fi

if [[ "$PLATFORM" == "all" || "$PLATFORM" == "linux" ]]; then
    echo "================================"
    print_info "Building Linux AppImage (x86_64)..."
    echo "================================"

    if [ -f "./build-scripts/build-appimage.sh" ]; then
        chmod +x "./build-scripts/build-appimage.sh"
        ./build-scripts/build-appimage.sh $VERSION $OUTPUT_DIR
        print_status "Linux AppImage (x86_64) built"
    else
        print_error "AppImage build script not found"
    fi
fi

if [[ "$PLATFORM" == "all" || "$PLATFORM" == "linux-arm" ]]; then
    echo "================================"
    print_info "Building Linux AppImage (ARM - $ARM_ARCH)..."
    echo "================================"

    if [ -f "./build-scripts/build-appimage-arm.sh" ]; then
        chmod +x "./build-scripts/build-appimage-arm.sh"
        ./build-scripts/build-appimage-arm.sh $VERSION $ARM_ARCH $OUTPUT_DIR
        print_status "Linux AppImage (ARM) built"
    else
        print_error "ARM AppImage build script not found"
    fi
fi

# Summary
echo "================================"
echo "Build Summary"
echo "================================"

print_status "Compilation complete"
print_info "Output directory: $OUTPUT_DIR"

echo ""
echo "Generated installers:"
ls -lh "$OUTPUT_DIR"/ 2>/dev/null || print_error "No files in output directory"

echo ""
echo "================================================"
print_status "All builds complete!"
echo "================================================"
