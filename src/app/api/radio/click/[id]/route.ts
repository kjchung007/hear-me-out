import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!/^[a-zA-Z0-9-]{8,64}$/.test(id))
    return NextResponse.json({ ok: false }, { status: 400 });
  fetch(`https://all.api.radio-browser.info/json/url/${id}`, {
    headers: { "User-Agent": "HearMeOut/0.1 (public radio globe)" },
  }).catch(() => undefined);
  return NextResponse.json({ ok: true });
}
