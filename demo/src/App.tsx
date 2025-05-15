import Editor from "@monaco-editor/react";
import { useEffect, useState } from "react";
import { JSONTree } from "react-json-tree";
import { type Node, parse } from "structured-markdown";
import defaultMarkdown from "../../markdown/simple.md";

function App() {
	const [markdown, setMarkdown] = useState(defaultMarkdown);
	const [node, setNode] = useState<Node | null>(null);
	const [error, setError] = useState<string | null>(null);

	const handleEditorChange = (value: string | undefined) => {
		if (!value) return;
		setMarkdown(value);
	};

	useEffect(() => {
		try {
			const { tree } = parse(markdown);
			setNode(tree);
			setError(null);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Unknown error occurred");
		}
	}, [markdown]);

	return (
		<div className="grid grid-cols-2 h-screen p-5 gap-5">
			<div className="flex-1 flex flex-col">
				<h2 className="m-0 mb-2.5">Markdown Input</h2>
				<div className="flex-1 border border-gray-300 rounded overflow-hidden">
					<Editor
						height="100%"
						defaultLanguage="markdown"
						value={markdown}
						onChange={handleEditorChange}
						theme="vs-light"
						options={{
							minimap: { enabled: false },
							fontSize: 14,
							wordWrap: "on",
						}}
					/>
				</div>
			</div>

			<div className="flex-1 flex flex-col">
				<h2 className="m-0 mb-2.5">Parsed Structure</h2>
				<div className="flex-1 border border-gray-300 rounded p-2.5 bg-white overflow-auto">
					{error ? (
						<div className="text-red-500">{error}</div>
					) : node ? (
						<JSONTree data={node.toJSON()} theme={{ scheme: "monokai" }} />
					) : (
						<div>No parsed structure available</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default App;
