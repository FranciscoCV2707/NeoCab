#!/bin/bash

# Linux AppImage Builder for ARM (Raspberry Pi)
# Supports: armv7 (32-bit) and aarch64 (64-bit)
# Usage: ./build-appimage-arm.sh [version] [arch]
# Example: ./build-appimage-arm.sh 3.0.0 armv7

set -e

VERSION="${1:-3.0.0}"
ARCH="${2:-armv7}"
OUTPUT_DIR="${3:-./dist}"
APPDIR="./NeoCab-${ARCH}.AppDir"

echo "================================================"
echo "NeoCab v3.0 - Linux AppImage Builder (ARM)"
echo "Architecture: $ARCH"
echo "================================================"

# Map architecture names
case $ARCH in
    armv7|arm)
        TARGET="armv7-unknown-linux-gnueabihf"
        APPIMAGE_ARCH="armhf"
        APPIMAGETOOL="appimagetool-armhf"
        ;;
    aarch64|arm64)
        TARGET="aarch64-unknown-linux-gnu"
        APPIMAGE_ARCH="arm_aarch64"
        APPIMAGETOOL="appimagetool-aarch64"
        ;;
    *)
        echo "Error: Unknown architecture: $ARCH"
        echo "Supported: armv7, aarch64"
        exit 1
        ;;
esac

# Check prerequisites
echo "Checking prerequisites..."

# Check if cross-compiled build exists
if [ ! -d "./src-tauri/target/$TARGET/release" ]; then
    echo "Error: Cross-compiled build not found for $TARGET"
    echo "Build with: cargo build --release --target $TARGET"
    exit 1
fi

# Check if appimagetool is available
if ! command -v $APPIMAGETOOL &> /dev/null; then
    echo "Error: $APPIMAGETOOL not found"
    echo "Download from: https://github.com/AppImage/AppImageKit/releases"
    exit 1
fi

echo "✓ Prerequisites OK (Target: $TARGET)"

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
mkdir -p "$APPDIR/usr/share/neocab"

# Copy executable
cp "./src-tauri/target/$TARGET/release/neocab" "$APPDIR/usr/bin/NeoCab"
chmod +x "$APPDIR/usr/bin/NeoCab"

# Copy data files
cp -r "./data" "$APPDIR/usr/share/neocab/"
cp -r "./config" "$APPDIR/usr/share/neocab/"
cp -r "./public" "$APPDIR/usr/share/neocab/"

# Copy real icon (fix the placeholder from x86_64 build)
if [ -f "src-tauri/icons/128x128.png" ]; then
    cp "src-tauri/icons/128x128.png" "$APPDIR/usr/share/pixmaps/neocab.png"
else
    touch "$APPDIR/usr/share/pixmaps/neocab.png"
fi

# Create .desktop file
cat > "$APPDIR/usr/share/applications/neocab.desktop" << 'EOF'
[Desktop Entry]
Name=NeoCab
Exec=NeoCab
Icon=neocab
Type=Application
Categories=Games;Emulator;
Comment=Professional Arcade Cabinet Operating System for Raspberry Pi
Terminal=false
EOF

# Create AppImage metadata
cat > "$APPDIR/AppImageMetadata.json" << EOF
{
  "name": "NeoCab",
  "version": "$VERSION",
  "description": "Professional Arcade Cabinet Operating System",
  "author": "NeoCab Project",
  "license": "GPL-3.0-or-later",
  "desktop-file": "neocab.desktop",
  "architecture": "$ARCH"
}
EOF

# Create AppRun symlink
ln -sf "usr/bin/NeoCab" "$APPDIR/AppRun"

# Build AppImage
echo "Generating AppImage for $ARCH..."
ARCH=$APPIMAGE_ARCH $APPIMAGETOOL "$APPDIR" "$OUTPUT_DIR/NeoCab-v${VERSION}-linux-${ARCH}.AppImage"

if [ $? -eq 0 ]; then
    echo "✓ AppImage built successfully"
    ls -lh "$OUTPUT_DIR/NeoCab-v${VERSION}-linux-${ARCH}.AppImage"
    chmod +x "$OUTPUT_DIR/NeoCab-v${VERSION}-linux-${ARCH}.AppImage"
else
    echo "✗ AppImage build failed"
    exit 1
fi

# Verify AppImage
echo "Verifying AppImage..."
file "$OUTPUT_DIR/NeoCab-v${VERSION}-linux-${ARCH}.AppImage"

# Cleanup
rm -rf "$APPDIR"

echo "================================================"
echo "Build complete!"
echo "AppImage ready at: $OUTPUT_DIR/NeoCab-v${VERSION}-linux-${ARCH}.AppImage"
echo "To test on Raspberry Pi:"
echo "  1. Copy AppImage to Raspberry Pi"
echo "  2. chmod +x NeoCab-v${VERSION}-linux-${ARCH}.AppImage"
echo "  3. ./NeoCab-v${VERSION}-linux-${ARCH}.AppImage"
echo "================================================"
