import { useRef, useState } from "react";
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
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [status, setStatus] = useState("");
  const [formValues, setFormValues] = useState({ search: "", replace: "" });
  const formRef = useRef<HTMLFormElement>(null);

  function getFormValues() {
    const data = new FormData(formRef.current!);
    return {
      search: data.get("search") as string,
      replace: data.get("replace") as string,
    };
  }

  function handleChange() {
    setFormValues(getFormValues());
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement;
    if (submitter.name === "find") {
      await handleFind();
    } else if (submitter.name === "replace") {
      await handleReplaceAll();
    }
  }

  async function handleFind() {
    try {
      const { search } = getFormValues();
      const items = await getTextItems();
      const regex = new RegExp(escapeRegExp(search), "gi");

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
    } catch {}
  }

  async function handleReplaceAll() {
    try {
      const { search, replace } = getFormValues();
      const regex = new RegExp(escapeRegExp(search), "gi");
      let count = 0;

      for (const match of matches) {
        const item = await miro.board.getById(match.id);
        if (isTextItem(item)) {
          item.content = item.content.replace(regex, replace);
          await item.sync();
          count++;
        }
      }

      setMatches([]);
      setStatus(`Replaced in ${count} item(s)`);
      await miro.board.notifications.showInfo(`Replaced in ${count} item(s)`);
    } catch {}
  }

  async function handleReplaceSingle(itemId: string) {
    const { search, replace } = getFormValues();
    const regex = new RegExp(escapeRegExp(search), "gi");

    const item = await miro.board.getById(itemId);
    if (isTextItem(item)) {
      item.content = item.content.replace(regex, replace);
      await item.sync();
      setMatches((prev) => prev.filter((m) => m.id !== itemId));
      setStatus(() => {
        const remaining = matches.length - 1;
        return remaining > 0 ? `${remaining} item(s) remaining` : "All done!";
      });
    }
  }

  async function handleZoomTo(itemId: string) {
    const item = await miro.board.getById(itemId);
    await miro.board.viewport.zoomTo(item);
  }

  return (
    <main>
      <form ref={formRef} onChange={handleChange} onSubmit={handleSubmit}>
        <div className="form-group form-group-small">
          <label htmlFor="search">Find:</label>
          <input className="input input-small" id="search" name="search" placeholder="Search text..." />
        </div>

        <div className="form-group form-group-small">
          <label htmlFor="replace">Replace with:</label>
          <input
            className="input input-small"
            id="replace"
            name="replace"
            placeholder="Replacement text..."
          />
        </div>

        <footer>
          <button className="button button-primary button-small" name="find" disabled={!formValues.search.trim()}>
            Find
          </button>
          <button className="button button-secondary button-small" name="replace" disabled={matches.length === 0 || !formValues.replace.trim()}>
            Replace All
          </button>
        </footer>
      </form>

      {status && <p>{status}</p>}

      {matches.length > 0 && (
        <section>
          <h3>Results</h3>
          <ul>
            {matches.map((m) => (
              <li key={m.id}>
                <div onClick={() => handleZoomTo(m.id)}>
                  <span>{m.type}</span>
                  <span>
                    {m.plainText.length > 80
                      ? m.plainText.substring(0, 80) + "..."
                      : m.plainText}
                  </span>
                </div>
                <button
                  type="button"
                  className="button button-secondary button-small"
                  onClick={() => handleReplaceSingle(m.id)}
                >
                  Replace
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
