/**
 * Unit tests for components/CropModal.tsx
 *
 * WHY these tests exist:
 * - Le recadrage est une action destructive sur l'image originale de Thomas
 * - Un crop qui echoue silencieusement = Thomas pense avoir recadre mais la photo est inchangee
 * - Le bouton "Appliquer" sans guard = double soumission = 2 images croppees empilees
 * - Touch targets < 44px = Thomas ne peut pas cliquer "Annuler" sur iPhone sur chantier
 * - Le backdrop click doit fermer sans sauvegarder (convention modale standard)
 *
 * LIMITATIONS:
 * - react-easy-crop n'est pas testable en JSDOM (canvas 2D + resize observer)
 * - Les tests verifient le comportement DOM (rendu, callbacks, etats), pas le crop pixel
 * - Le crop reel est teste en E2E (Playwright) avec un vrai navigateur
 *
 * PREREQUIS: Vitest + @testing-library/react non installes dans le projet.
 * Pour executer ces tests, installer:
 *   npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
 * Puis ajouter un vitest.config.ts (voir qa-strategy.md).
 *
 * En attendant, ce fichier documente les scenarios de test et servira
 * de base des que Vitest sera ajoute au projet.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock react-easy-crop — JSDOM ne supporte pas Canvas/ResizeObserver
vi.mock("react-easy-crop", () => {
  return {
    __esModule: true,
    default: (props: {
      image: string;
      crop: { x: number; y: number };
      zoom: number;
      minZoom: number;
      maxZoom: number;
      onCropChange: (crop: { x: number; y: number }) => void;
      onZoomChange: (zoom: number) => void;
      onCropComplete: (area: { x: number; y: number; width: number; height: number }, pixels: { x: number; y: number; width: number; height: number }) => void;
    }) => {
      return (
        <div
          data-testid="mock-cropper"
          data-image={props.image}
          data-zoom={props.zoom}
          data-min-zoom={props.minZoom}
          data-max-zoom={props.maxZoom}
          onClick={() => {
            // Simulate a crop complete event when clicked (for testing handleSave)
            props.onCropComplete(
              { x: 10, y: 10, width: 80, height: 60 },
              { x: 100, y: 100, width: 800, height: 600 }
            );
          }}
        />
      );
    },
  };
});

// Mock getCroppedImg — canvas operations don't work in JSDOM
// We intercept the module-level function by mocking the canvas API
beforeEach(() => {
  // Mock HTMLCanvasElement.getContext
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
    drawImage: vi.fn(),
  }) as unknown as typeof HTMLCanvasElement.prototype.getContext;

  HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue(
    "data:image/jpeg;base64,/9j/fakecroppedimage"
  );

  // Mock Image constructor for getCroppedImg
  const originalImage = globalThis.Image;
  (vi.spyOn(globalThis, "Image" as never) as unknown as {
    mockImplementation: (fn: () => HTMLImageElement) => void;
  }).mockImplementation(() => {
    const img = new originalImage();
    // Force onload to fire immediately
    setTimeout(() => {
      if (img.onload) (img.onload as () => void)();
    }, 0);
    return img;
  });
});

import CropModal from "@/components/CropModal";

// ─── Fixtures ────────────────────────────────────────────────────────

const TEST_IMAGE_URL = "/api/logs/image?path=logs/test_input.jpg";
const mockOnCrop = vi.fn().mockResolvedValue(undefined);
const mockOnClose = vi.fn();

function renderCropModal(overrides: Partial<{
  imageUrl: string;
  onCrop: (base64: string) => Promise<void>;
  onClose: () => void;
}> = {}) {
  return render(
    <CropModal
      imageUrl={overrides.imageUrl ?? TEST_IMAGE_URL}
      onCrop={overrides.onCrop ?? mockOnCrop}
      onClose={overrides.onClose ?? mockOnClose}
    />
  );
}

// ─── Tests ───────────────────────────────────────────────────────────

describe("CropModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Rendu initial ---

  it("affiche le modal avec le titre 'Recadrer la photo'", () => {
    renderCropModal();
    expect(screen.getByText("Recadrer la photo")).toBeInTheDocument();
  });

  it("affiche le composant Cropper avec l'image fournie", () => {
    renderCropModal();
    const cropper = screen.getByTestId("mock-cropper");
    expect(cropper).toHaveAttribute("data-image", TEST_IMAGE_URL);
  });

  // --- Slider de zoom ---

  it("affiche un slider de zoom avec min=1 et max=3", () => {
    renderCropModal();
    const slider = screen.getByRole("slider");
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute("min", "1");
    expect(slider).toHaveAttribute("max", "3");
    expect(slider).toHaveAttribute("step", "0.05");
  });

  it("affiche le pourcentage de zoom initial a 100%", () => {
    renderCropModal();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("met a jour le zoom quand le slider change", () => {
    renderCropModal();
    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "2" } });
    expect(screen.getByText("200%")).toBeInTheDocument();
  });

  it("le label 'Zoom' est visible", () => {
    renderCropModal();
    expect(screen.getByText("Zoom")).toBeInTheDocument();
  });

  // --- Bouton Annuler ---

  it("le bouton 'Annuler' appelle onClose au clic", () => {
    renderCropModal();
    const cancelBtn = screen.getByText("Annuler");
    fireEvent.click(cancelBtn);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("le bouton X (aria-label 'Fermer') appelle onClose", () => {
    renderCropModal();
    const closeBtn = screen.getByLabelText("Fermer");
    fireEvent.click(closeBtn);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  // --- Bouton Appliquer ---

  it("affiche le bouton 'Appliquer le recadrage' par defaut", () => {
    renderCropModal();
    expect(screen.getByText("Appliquer le recadrage")).toBeInTheDocument();
  });

  it("appelle onCrop avec une base64 apres crop complete + clic Appliquer", async () => {
    renderCropModal();

    // Simuler un crop complete via clic sur le mock cropper
    const cropper = screen.getByTestId("mock-cropper");
    fireEvent.click(cropper);

    // Cliquer sur Appliquer
    const applyBtn = screen.getByText("Appliquer le recadrage");
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(mockOnCrop).toHaveBeenCalledTimes(1);
      expect(mockOnCrop).toHaveBeenCalledWith(
        expect.stringMatching(/^data:image\/jpeg;base64,/)
      );
    });
  });

  // --- Etat isSaving ---

  it("affiche 'Recadrage...' pendant le traitement", async () => {
    // onCrop qui ne resolve jamais (pour maintenir isSaving=true)
    const slowOnCrop = vi.fn().mockReturnValue(new Promise(() => {}));
    renderCropModal({ onCrop: slowOnCrop });

    // Trigger crop complete
    const cropper = screen.getByTestId("mock-cropper");
    fireEvent.click(cropper);

    // Click apply
    const applyBtn = screen.getByText("Appliquer le recadrage");
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(screen.getByText("Recadrage...")).toBeInTheDocument();
    });
  });

  it("le bouton Appliquer est disabled pendant isSaving", async () => {
    const slowOnCrop = vi.fn().mockReturnValue(new Promise(() => {}));
    renderCropModal({ onCrop: slowOnCrop });

    const cropper = screen.getByTestId("mock-cropper");
    fireEvent.click(cropper);

    const applyBtn = screen.getByText("Appliquer le recadrage");
    fireEvent.click(applyBtn);

    await waitFor(() => {
      const savingBtn = screen.getByText("Recadrage...");
      expect(savingBtn).toBeDisabled();
    });
  });

  // --- Backdrop ---

  it("clic sur le backdrop (overlay) ferme le modal", () => {
    const { container } = renderCropModal();
    // Le backdrop est le div fixed parent
    const backdrop = container.firstElementChild as HTMLElement;
    fireEvent.click(backdrop);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("clic sur le contenu du modal ne ferme PAS le modal (stopPropagation)", () => {
    renderCropModal();
    // Cliquer sur le titre (a l'interieur du modal)
    const title = screen.getByText("Recadrer la photo");
    fireEvent.click(title);
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  // --- Touch targets (accessibilite mobile) ---

  it("le bouton 'Annuler' a une hauteur minimum de 44px pour les touch targets", () => {
    renderCropModal();
    const cancelBtn = screen.getByText("Annuler");
    // Verifie la classe CSS min-h-[44px]
    expect(cancelBtn.className).toContain("min-h-[44px]");
  });

  it("le bouton 'Appliquer le recadrage' a une hauteur minimum de 44px", () => {
    renderCropModal();
    const applyBtn = screen.getByText("Appliquer le recadrage");
    expect(applyBtn.className).toContain("min-h-[44px]");
  });

  // --- Focus visible (accessibilite) ---

  it("les boutons ont des styles focus-visible pour la navigation clavier", () => {
    renderCropModal();
    const cancelBtn = screen.getByText("Annuler");
    const applyBtn = screen.getByText("Appliquer le recadrage");
    expect(cancelBtn.className).toContain("focus-visible:");
    expect(applyBtn.className).toContain("focus-visible:");
  });

  // --- Edge case : pas de croppedAreaPixels ---

  it("ne fait rien si Appliquer est clique avant un crop (croppedAreaPixels null)", () => {
    renderCropModal();
    // Cliquer Appliquer SANS avoir fait de crop
    const applyBtn = screen.getByText("Appliquer le recadrage");
    fireEvent.click(applyBtn);
    // onCrop ne doit pas etre appele
    expect(mockOnCrop).not.toHaveBeenCalled();
  });

  // --- Edge case : erreur pendant le crop ---

  it("remet isSaving a false si onCrop rejette", async () => {
    const failingOnCrop = vi.fn().mockRejectedValue(new Error("Network error"));
    renderCropModal({ onCrop: failingOnCrop });

    const cropper = screen.getByTestId("mock-cropper");
    fireEvent.click(cropper);

    const applyBtn = screen.getByText("Appliquer le recadrage");
    fireEvent.click(applyBtn);

    // Apres l'erreur, le bouton doit redevenir "Appliquer le recadrage"
    await waitFor(() => {
      expect(screen.getByText("Appliquer le recadrage")).not.toBeDisabled();
    });
  });
});
