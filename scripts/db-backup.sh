#!/usr/bin/env bash
# بکاپ فشرده از دیتابیس جوانه‌بازار (بدون توقف سرویس).
# استفاده: npm run db:backup   یا   bash scripts/db-backup.sh
set -euo pipefail

CONTAINER="${DB_CONTAINER:-javaneh-db}"
DB_USER="${DB_USER:-javaneh}"
DB_NAME="${DB_NAME:-javaneh}"
BACKUP_DIR="${BACKUP_DIR:-backups}"

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y-%m-%d_%H-%M-%S)"
FILE="$BACKUP_DIR/javaneh-$STAMP.dump"

echo "🗄️  در حال گرفتن بکاپ از $DB_NAME …"
docker exec "$CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" -Fc > "$FILE"
echo "✅ بکاپ ساخته شد: $FILE ($(du -h "$FILE" | cut -f1))"

# نگه‌داشتن ۱۰ بکاپ آخر
ls -1t "$BACKUP_DIR"/javaneh-*.dump 2>/dev/null | tail -n +11 | while read -r old; do
  rm -f "$old"
  echo "🧹 بکاپ قدیمی حذف شد: $old"
done
