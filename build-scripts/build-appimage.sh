#!/bin/bash

# Linux AppImage Builder Script for NeoCab v3.0
# Usage: ./build-appimage.sh [version]

set -e

VERSION="${1:-3.0.0}"
OUTPUT_DIR="${2:-./dist}"
APPDIR="./NeoCab.AppDir"

echo "================================================"
echo "NeoCab v3.0 - Linux AppImage Builder"
echo "================================================"

# Check prerequisites
echo "Checking prerequisites..."

# Check if Tauri build exists
if [ ! -d "./src-tauri/target/release" ]; then
    echo "Error: Tauri release build not found. Run: cargo build --release"
    exit 1
fi

# Check if appimagetool is available
if ! command -v appimagetool &> /dev/null; then
    echo "Error: appimagetool not found. Install via:"
    echo "  wget https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage"
    echo "  chmod +x appimagetool-x86_64.AppImage"
    exit 1
fi

echo "✓ Prerequisites OK"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Clean previous build
rm -rf "$APPDIR"

echo "Building AppImage..."

# Create AppDir structure
mkdir -p "$APPDIR/usr/bin"
mkdir -p "$APPDIR/usr/lib"
mkdir -p "$APPDIR/usr/share/pixmaps"
mkdir -p "$APPDIR/usr/share/applications"

# Copy executable
cp "./src-tauri/target/release/neocab" "$APPDIR/usr/bin/NeoCab"
chmod +x "$APPDIR/usr/bin/NeoCab"

# Copy data files
cp -r "./data" "$APPDIR/usr/share/neocab"
cp -r "./config" "$APPDIR/usr/share/neocab"
cp -r "./public" "$APPDIR/usr/share/neocab"

# Create .desktop file
cat > "$APPDIR/usr/share/applications/neocab.desktop" << 'EOF'
[Desktop Entry]
Name=NeoCab
Exec=NeoCab
Icon=neocab
Type=Application
Categories=Games;Emulator;
Comment=Professional Arcade Cabinet Operating System
Terminal=false
EOF

# Create AppImage metadata
cat > "$APPDIR/AppImageMetadata.json" << 'EOF'
{
  "name": "NeoCab",
  "version": "VERSION_PLACEHOLDER",
  "description": "Professional Arcade Cabinet Operating System",
  "author": "NeoCab Project",
  "license": "MIT",
  "desktop-file": "neocab.desktop"
}
EOF

sed -i "s/VERSION_PLACEHOLDER/$VERSION/g" "$APPDIR/AppImageMetadata.json"

# Create AppRun symlink
ln -sf "usr/bin/NeoCab" "$APPDIR/AppRun"

# Create icon placeholder
touch "$APPDIR/usr/share/pixmaps/neocab.png"

# Build AppImage
echo "Generating AppImage..."
ARCH=x86_64 appimagetool "$APPDIR" "$OUTPUT_DIR/NeoCab-v${VERSION}-linux-x86_64.AppImage"

if [ $? -eq 0 ]; then
    echo "✓ AppImage built successfully"
    ls -lh "$OUTPUT_DIR/NeoCab-v${VERSION}-linux-x86_64.AppImage"
    chmod +x "$OUTPUT_DIR/NeoCab-v${VERSION}-linux-x86_64.AppImage"
else
    echo "✗ AppImage build failed"
    exit 1
fi

# Verify AppImage
echo "Verifying AppImage..."
file "$OUTPUT_DIR/NeoCab-v${VERSION}-linux-x86_64.AppImage"

# Cleanup
rm -rf "$APPDIR"

echo "================================================"
echo "Build complete!"
echo "AppImage ready at: $OUTPUT_DIR/NeoCab-v${VERSION}-linux-x86_64.AppImage"
echo "================================================"
