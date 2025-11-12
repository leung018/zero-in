set -e

# Only allow execution on main branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$CURRENT_BRANCH" != "main" ]]; then
  echo "❌ Script can only be run on the 'main' branch (current: $CURRENT_BRANCH)"
  exit 1
fi

# Default config
LOCAL_BUILD=false
OUTPUT_AAB="zero-in.aab"

# Parse arguments
for arg in "$@"; do
  case $arg in
    --local) LOCAL_BUILD=true ;;
  esac
done

yarn install --immutable

# TODO: I don't test below now because I don't want waste the quota of eas build for remote build.
# For local build, I don't want to wait for build time.
# So test below next time when I really need it.

# TODO: Add ios

if [ "$LOCAL_BUILD" = true ]; then
  echo "🚧 Running local build with fixed output..."

  echo "🛠 Building Android app..."
  eas build --platform android --profile production --local --output "$OUTPUT_AAB" --non-interactive

  echo "🚀 Submitting Android local build to store..."
  eas submit --platform android --path "$OUTPUT_AAB" --non-interactive

  echo "✅ Local build & submit complete: $OUTPUT_AAB"
else
  echo "☁️ Running cloud build with auto-submit..."

  echo "🛠 Building & submitting Android app..."
  eas build --platform android --profile production --auto-submit --non-interactive

  echo "✅ Cloud build & submit complete"
fi
