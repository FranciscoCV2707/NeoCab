#!/bin/bash

# Linux ARM AppImage Builder Script for NeoCab v3.0 (Raspberry Pi / ARM boards)
# Builds AppImage for armv7 (32-bit) and aarch64 (64-bit)
# Usage: ./build-appimage-arm.sh [version] [arch]

set -e

VERSION="${1:-3.0.0}"
ARCH="${2:-armv7}"
OUTPUT_DIR="${3:-./dist}"
APPDIR="./NeoCab-ARM.AppDir"

echo "================================================"
echo "NeoCab v3.0 - ARM Linux AppImage Builder"
echo "Architecture: $ARCH"
echo "Version: $VERSION"
echo "================================================"

# Validate architecture
if [[ "$ARCH" != "armv7" && "$ARCH" != "aarch64" ]]; then
    echo "Error: Unsupported architecture '$ARCH'. Use 'armv7' or 'aarch64'"
    exit 1
fi

# Check prerequisites
echo "Checking prerequisites..."

# Check if Tauri ARM release build exists
if [ ! -d "./src-tauri/target/release" ]; then
    echo "Error: Tauri ARM release build not found."
    echo "Build with: cargo build --release --target=$ARCH"
    exit 1
fi

# For cross-compilation
if [ "$ARCH" = "armv7" ]; then
    TARGET_TRIPLE="armv7-unknown-linux-gnueabihf"
    BINARY_NAME="neocab"
elif [ "$ARCH" = "aarch64" ]; then
    TARGET_TRIPLE="aarch64-unknown-linux-gnu"
    BINARY_NAME="neocab"
fi

# Check if appimagetool is available
if ! command -v appimagetool &> /dev/null; then
    echo "Error: appimagetool not found. Install via:"
    echo "  wget https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-${ARCH}.AppImage"
    echo "  chmod +x appimagetool-${ARCH}.AppImage"
    exit 1
fi

echo "✓ Prerequisites OK"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Clean previous build
rm -rf "$APPDIR"

echo "Building AppImage for $ARCH..."

# Create AppDir structure
mkdir -p "$APPDIR/usr/bin"
mkdir -p "$APPDIR/usr/lib"
mkdir -p "$APPDIR/usr/share/pixmaps"
mkdir -p "$APPDIR/usr/share/applications"

# Copy executable
if [ -f "./src-tauri/target/$TARGET_TRIPLE/release/$BINARY_NAME" ]; then
    cp "./src-tauri/target/$TARGET_TRIPLE/release/$BINARY_NAME" "$APPDIR/usr/bin/NeoCab"
    chmod +x "$APPDIR/usr/bin/NeoCab"
else
    echo "Error: Binary not found at ./src-tauri/target/$TARGET_TRIPLE/release/$BINARY_NAME"
    exit 1
fi

# Copy data files
cp -r "./data" "$APPDIR/usr/share/neocab" 2>/dev/null || true
cp -r "./config" "$APPDIR/usr/share/neocab" 2>/dev/null || true
cp -r "./public" "$APPDIR/usr/share/neocab" 2>/dev/null || true

# Copy shaders (ensure bundled)
mkdir -p "$APPDIR/usr/share/neocab/config/shaders"
if [ -d "./config/shaders" ]; then
    cp -r "./config/shaders/"* "$APPDIR/usr/share/neocab/config/shaders/" 2>/dev/null || true
fi

# Copy icon
if [ -f "./src-tauri/icons/128x128.png" ]; then
    cp "./src-tauri/icons/128x128.png" "$APPDIR/usr/share/pixmaps/neocab.png"
else
    echo "Warning: Icon not found, creating placeholder"
    touch "$APPDIR/usr/share/pixmaps/neocab.png"
fi

# Create .desktop file
cat > "$APPDIR/usr/share/applications/neocab.desktop" << 'DESKTOP'
[Desktop Entry]
Name=NeoCab
Exec=NeoCab
Icon=neocab
Type=Application
Categories=Games;Emulator;
Comment=Professional Arcade Cabinet Operating System
Terminal=false
DESKTOP

# Create AppRun symlink
ln -sf "usr/bin/NeoCab" "$APPDIR/AppRun"

# Build AppImage
echo "Generating AppImage for $ARCH..."
if [ "$ARCH" = "armv7" ]; then
    ARCH_FLAG="armhf"
    OUTPUT_FILE="$OUTPUT_DIR/NeoCab-v${VERSION}-linux-armv7.AppImage"
else
    ARCH_FLAG="arm_aarch64"
    OUTPUT_FILE="$OUTPUT_DIR/NeoCab-v${VERSION}-linux-aarch64.AppImage"
fi

ARCH=$ARCH_FLAG appimagetool "$APPDIR" "$OUTPUT_FILE"

if [ $? -eq 0 ]; then
    echo "✓ AppImage built successfully"
    ls -lh "$OUTPUT_FILE"
    chmod +x "$OUTPUT_FILE"
else
    echo "✗ AppImage build failed"
    exit 1
fi

# Verify AppImage
echo "Verifying AppImage..."
file "$OUTPUT_FILE"

# Cleanup
rm -rf "$APPDIR"

echo "================================================"
echo "Build complete!"
echo "AppImage ready at: $OUTPUT_FILE"
echo "================================================"
