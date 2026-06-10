import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import Tesseract from "tesseract.js";

type JokeResponse = {
  joke?: string;
  error?: string;
};

const exampleText =
  "Meeting notes: remember to bring donuts, approve the new printer budget, and stop calling every spreadsheet a database.";

function App() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState("Ready to scan");
  const [extractedText, setExtractedText] = useState("");
  const [joke, setJoke] = useState("");
  const [error, setError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isGeneratingJoke, setIsGeneratingJoke] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const canScan = Boolean(imageFile) && !isScanning;
  const canGenerateJoke = extractedText.trim().length > 0 && !isGeneratingJoke;

  const textCharacterCount = useMemo(
    () => extractedText.trim().length,
    [extractedText]
  );

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  function selectImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file so Scanajoke can read it.");
      return;
    }

    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setExtractedText("");
    setJoke("");
    setError("");
    setOcrProgress(0);
    setOcrStatus("Image ready");
  }

  async function scanImage() {
    if (!imageFile) {
      setError("Add a document photo or screenshot first.");
      return;
    }

    setIsScanning(true);
    setError("");
    setJoke("");
    setOcrProgress(0);
    setOcrStatus("Preparing OCR engine");

    try {
      const result = await Tesseract.recognize(imageFile, "eng", {
        logger: (message) => {
          if (typeof message.progress === "number") {
            setOcrProgress(Math.round(message.progress * 100));
          }

          if (message.status) {
            setOcrStatus(message.status);
          }
        }
      });
      const text = result.data.text.trim().replace(/\n{3,}/g, "\n\n");

      if (!text) {
        setExtractedText("");
        setError(
          "No readable text was found. Try a clearer, well-lit image with less background clutter."
        );
        setOcrStatus("No text found");
        return;
      }

      setExtractedText(text);
      setOcrProgress(100);
      setOcrStatus("Text extracted");
      await generateJoke(text);
    } catch (scanError) {
      setError(
        scanError instanceof Error
          ? scanError.message
          : "Something went wrong while scanning the image."
      );
      setOcrStatus("Scan failed");
    } finally {
      setIsScanning(false);
    }
  }

  async function generateJoke(textOverride?: string) {
    const textToSend = (textOverride ?? extractedText).trim();

    if (!textToSend) {
      setError("Scan or paste some text first so OpenAI has setup material.");
      return;
    }

    setIsGeneratingJoke(true);
    setError("");
    setJoke("");

    try {
      const response = await fetch("/api/joke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text: textToSend })
      });
      const payload = (await response.json()) as JokeResponse;

      if (!response.ok || !payload.joke) {
        throw new Error(payload.error ?? "OpenAI could not make a joke yet.");
      }

      setJoke(payload.joke);
    } catch (jokeError) {
      setError(
        jokeError instanceof Error
          ? jokeError.message
          : "Something went wrong while generating the joke."
      );
    } finally {
      setIsGeneratingJoke(false);
    }
  }

  function loadExample() {
    setExtractedText(exampleText);
    setImageFile(null);
    setImagePreviewUrl(null);
    setJoke("");
    setError("");
    setOcrStatus("Example text loaded");
    setOcrProgress(0);
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Scan. Read. Laugh.</p>
          <h1>Turn real-world text into instant AI puns.</h1>
          <p className="hero-description">
            Scan a receipt, sign, page, note, or screenshot. Scanajoke extracts
            the text in your browser, then asks OpenAI to write a quick joke or
            pun from what it found.
          </p>
          <div className="hero-actions" aria-label="Choose image source">
            <button
              className="primary-button"
              type="button"
              onClick={() => cameraInputRef.current?.click()}
            >
              Scan with camera
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload image
            </button>
          </div>
          <input
            ref={cameraInputRef}
            className="visually-hidden"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={selectImage}
          />
          <input
            ref={fileInputRef}
            className="visually-hidden"
            type="file"
            accept="image/*"
            onChange={selectImage}
          />
        </div>

        <div className="hero-card" aria-label="How Scanajoke works">
          <span>1. Add a photo</span>
          <span>2. OCR reads the words</span>
          <span>3. OpenAI lands the punchline</span>
        </div>
      </section>

      <section className="workspace-grid" aria-label="Scanner workspace">
        <article className="panel scanner-panel">
          <div className="panel-heading">
            <p className="step-label">Step 1</p>
            <h2>Scan text</h2>
          </div>

          <div className="preview-frame">
            {imagePreviewUrl ? (
              <img src={imagePreviewUrl} alt="Selected document preview" />
            ) : (
              <div className="empty-preview">
                <span className="preview-icon" aria-hidden="true">
                  PDF
                </span>
                <p>Snap a document, sign, page, or screenshot to begin.</p>
              </div>
            )}
          </div>

          <button
            className="primary-button full-width"
            type="button"
            disabled={!canScan}
            onClick={scanImage}
          >
            {isScanning ? "Reading text..." : "Extract text"}
          </button>

          <div className="progress-block" aria-live="polite">
            <div className="progress-header">
              <span>{ocrStatus}</span>
              <span>{ocrProgress}%</span>
            </div>
            <progress value={ocrProgress} max="100">
              {ocrProgress}%
            </progress>
          </div>
        </article>

        <article className="panel text-panel">
          <div className="panel-heading">
            <p className="step-label">Step 2</p>
            <h2>Review extracted text</h2>
          </div>

          <textarea
            value={extractedText}
            onChange={(event) => setExtractedText(event.target.value)}
            placeholder="Extracted text appears here. You can also paste text directly."
            rows={12}
          />

          <div className="text-tools">
            <span>{textCharacterCount} characters</span>
            <button className="link-button" type="button" onClick={loadExample}>
              Try example text
            </button>
          </div>

          <button
            className="primary-button full-width"
            type="button"
            disabled={!canGenerateJoke}
            onClick={() => generateJoke()}
          >
            {isGeneratingJoke ? "Writing punchline..." : "Make a joke"}
          </button>
        </article>

        <article className="panel joke-panel">
          <div className="panel-heading">
            <p className="step-label">Step 3</p>
            <h2>Enjoy the pun</h2>
          </div>

          {joke ? (
            <blockquote>{joke}</blockquote>
          ) : (
            <div className="empty-joke">
              <p>
                Your joke will appear here after OpenAI reads the scanned text.
              </p>
            </div>
          )}

          {error ? (
            <div className="error-message" role="alert">
              {error}
            </div>
          ) : null}
        </article>
      </section>
    </main>
  );
}

export default App;
