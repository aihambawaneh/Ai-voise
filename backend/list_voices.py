import asyncio
import edge_tts

async def list_voices():
    voices = await edge_tts.VoicesManager.create()
    ar_voices = voices.find(Language="ar")
    for v in ar_voices:
        print(f"{v['ShortName']} - {v['Gender']} - {v['Locale']}")

if __name__ == "__main__":
    asyncio.run(list_voices())
