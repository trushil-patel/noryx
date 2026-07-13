import asyncio
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from memora.services.extraction import build_knowledge_document
from memora.supabase import admin_client


async def main() -> None:
    client = admin_client()

    response = (
        client.table("knowledge_items")
        .select("id,original_url,thumbnail_url")
        .is_("thumbnail_url", "null")
        .execute()
    )

    items = response.data or []

    print(f"Found {len(items)} memories without thumbnails.")

    for index, item in enumerate(items, start=1):
        memory_id = item["id"]
        url = item["original_url"]

        print(f"[{index}/{len(items)}] Extracting thumbnail: {url}")

        try:
            document = await build_knowledge_document(url)

            if not document.thumbnail_url:
                print("  No thumbnail found.")
                continue

            (
                client.table("knowledge_items")
                .update({"thumbnail_url": document.thumbnail_url})
                .eq("id", memory_id)
                .execute()
            )

            print(f"  Updated: {document.thumbnail_url}")

        except Exception as exc:
            print(f"  Failed: {exc}")

        await asyncio.sleep(0.5)


if __name__ == "__main__":
    asyncio.run(main())