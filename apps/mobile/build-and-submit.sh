set -euo pipefail

# Only allow execution on main branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$CURRENT_BRANCH" != "main" ]]; then
  echo "❌ Script can only be run on the 'main' branch (current: $CURRENT_BRANCH)"
  exit 1
fi

# Exit if there are uncommitted changes (including untracked files)
if [[ -n "$(git status --porcelain)" ]]; then
  echo "❌ Working directory has uncommitted changes. Please commit or stash them before running this script."
  git status --porcelain
  exit 1
fi

# Default config
LOCAL_BUILD=false
PLATFORM=""
OUTPUT_FILE=""

# Parse arguments
for arg in "$@"; do
  case $arg in
    --local) 
      LOCAL_BUILD=true 
      ;;
    --platform=*)
      PLATFORM="${arg#*=}"
      ;;
    *)
      echo "❌ Unknown argument: $arg"
      echo "Usage: $0 --platform=<android|ios> [--local]"
      exit 1
      ;;
  esac
done

# Validate platform argument
if [[ -z "$PLATFORM" ]]; then
  echo "❌ Platform is required"
  echo "Usage: $0 --platform=<android|ios> [--local]"
  exit 1
fi

if [[ "$PLATFORM" != "android" && "$PLATFORM" != "ios" ]]; then
  echo "❌ Invalid platform: $PLATFORM (must be 'android' or 'ios')"
  exit 1
fi

# Set output file based on platform
if [[ "$PLATFORM" == "android" ]]; then
  OUTPUT_FILE="zero-in.aab"
else
  OUTPUT_FILE="zero-in.ipa"
fi

yarn install --immutable
yarn cng

# TODO: I don't test below now because I don't want waste the quota of eas build for remote build.
# For local build, I don't want to wait for build time.
# So test below next time when I really need it.

if [ "$LOCAL_BUILD" = true ]; then
  echo "🚧 Running local build with fixed output..."

  echo "🛠 Building $PLATFORM app..."
  eas build --platform "$PLATFORM" --profile production --local --output "$OUTPUT_FILE"

  echo "🚀 Submitting $PLATFORM local build to store..."
  eas submit --platform "$PLATFORM" --path "$OUTPUT_FILE"

  echo "✅ Local build & submit complete: $OUTPUT_FILE"
else
  echo "☁️ Running cloud build with auto-submit..."

  echo "🛠 Building & submitting $PLATFORM app..."
  eas build --platform "$PLATFORM" --profile production --auto-submit

  echo "✅ Cloud build & submit complete"
fi