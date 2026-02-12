import { useState } from "react";
import { createRoot } from "react-dom/client";
import "mirotone/dist/styles.css";
import "./app.css";

type TextItem = {
  id: string;
  type: string;
  content: string;
  sync: () => Promise<void>;
};

type MatchResult = {
  id: string;
  type: string;
  plainText: string;
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isTextItem(item: unknown): item is TextItem {
  return (
    typeof item === "object" &&
    item !== null &&
    "content" in item &&
    typeof (item as TextItem).content === "string"
  );
}

async function getTextItems(): Promise<TextItem[]> {
  const items = await miro.board.get({
    type: ["sticky_note", "text", "shape"],
  });
  return (items as unknown as TextItem[]).filter(
    (item) => typeof item.content === "string",
  );
}

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [status, setStatus] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFind = async () => {
    if (!searchTerm.trim()) return;
    setIsLoading(true);

    try {
      const items = await getTextItems();
      const flags = caseSensitive ? "g" : "gi";
      const regex = new RegExp(escapeRegExp(searchTerm), flags);

      const found: MatchResult[] = [];
      for (const item of items) {
        const plain = stripHtml(item.content);
        if (regex.test(plain)) {
          found.push({ id: item.id, type: item.type, plainText: plain });
        }
        regex.lastIndex = 0;
      }

      setMatches(found);
      setStatus(`Found ${found.length} item(s)`);

      if (found.length > 0) {
        await miro.board.notifications.showInfo(
          `Found ${found.length} item(s)`,
        );
      } else {
        await miro.board.notifications.showError("No matches found");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplaceAll = async () => {
    if (!searchTerm.trim() || matches.length === 0) return;
    setIsLoading(true);

    try {
      const flags = caseSensitive ? "g" : "gi";
      const regex = new RegExp(escapeRegExp(searchTerm), flags);
      let count = 0;

      for (const match of matches) {
        const item = await miro.board.getById(match.id);
        if (isTextItem(item)) {
          item.content = item.content.replace(regex, replaceTerm);
          await item.sync();
          count++;
        }
      }

      setMatches([]);
      setStatus(`Replaced in ${count} item(s)`);
      await miro.board.notifications.showInfo(`Replaced in ${count} item(s)`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplaceSingle = async (itemId: string) => {
    if (!searchTerm.trim()) return;

    const flags = caseSensitive ? "g" : "gi";
    const regex = new RegExp(escapeRegExp(searchTerm), flags);

    const item = await miro.board.getById(itemId);
    if (isTextItem(item)) {
      item.content = item.content.replace(regex, replaceTerm);
      await item.sync();
      setMatches((prev) => prev.filter((m) => m.id !== itemId));
      setStatus(() => {
        const remaining = matches.length - 1;
        return remaining > 0 ? `${remaining} item(s) remaining` : "All done!";
      });
    }
  };

  const handleZoomTo = async (itemId: string) => {
    const item = await miro.board.getById(itemId);
    await miro.board.viewport.zoomTo(item);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleFind();
    }
  };

  return (
    <div className="panel">
      <div className="form-group">
        <label htmlFor="search">Find</label>
        <input
          id="search"
          className="input"
          type="text"
          placeholder="Search text..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      <div className="form-group">
        <label htmlFor="replace">Replace with</label>
        <input
          id="replace"
          className="input"
          type="text"
          placeholder="Replacement text..."
          value={replaceTerm}
          onChange={(e) => setReplaceTerm(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      <label className="checkbox">
        <input
          type="checkbox"
          checked={caseSensitive}
          onChange={(e) => setCaseSensitive(e.target.checked)}
        />
        <span>Case sensitive</span>
      </label>

      <div className="button-group">
        <button
          className="button button-primary"
          onClick={handleFind}
          disabled={isLoading || !searchTerm.trim()}
        >
          {isLoading ? "Searching..." : "Find"}
        </button>
        <button
          className="button button-danger"
          onClick={handleReplaceAll}
          disabled={isLoading || matches.length === 0}
        >
          Replace All
        </button>
      </div>

      {status && <p className="status">{status}</p>}

      {matches.length > 0 && (
        <div className="results">
          <h3 className="results-title">Results</h3>
          <ul className="results-list">
            {matches.map((m) => (
              <li key={m.id} className="result-item">
                <div
                  className="result-content"
                  onClick={() => handleZoomTo(m.id)}
                >
                  <span className="result-type">{m.type}</span>
                  <span className="result-text">
                    {m.plainText.length > 80
                      ? m.plainText.substring(0, 80) + "..."
                      : m.plainText}
                  </span>
                </div>
                <button
                  className="button button-secondary button-small"
                  onClick={() => handleReplaceSingle(m.id)}
                >
                  Replace
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
