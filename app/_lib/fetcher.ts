export async function fetcher(...args: Parameters<typeof fetch>) {
	const data = await fetch(...args);

	const json = await data.json();

	return json;
}
