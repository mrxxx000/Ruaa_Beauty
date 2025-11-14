export async function getMessage(): Promise<string> {
  const res = await fetch("http://localhost:5000/");
  return res.text();
}
