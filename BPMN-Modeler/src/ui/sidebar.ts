import { ensureElement } from "shared-utils";

export function createSidebar({
  sidebarElement,
  toggleButton = null,
  initialOpen = true,
  onChange = (_isOpen: boolean) => {},
}: any) {
  const sidebar = ensureElement(sidebarElement, "panel lateral");
  const button = toggleButton ? ensureElement(toggleButton, "botón del panel lateral") : null;
  let isOpen = Boolean(initialOpen);

  function render() {
    if (isOpen) {
      sidebar.classList.remove("sidebar--hidden");
      sidebar.setAttribute("aria-hidden", "false");
    } else {
      sidebar.classList.add("sidebar--hidden");
      sidebar.setAttribute("aria-hidden", "true");
    }
    if (button) {
      button.setAttribute("aria-expanded", String(isOpen));
      button.textContent = isOpen ? "Ocultar" : "Propiedades";
    }
  }

  function setOpen(value: boolean) {
    isOpen = value;
    render();
    onChange(isOpen);
  }

  render();

  return {
    toggle: () => setOpen(!isOpen),
    setOpen,
    isOpen: () => isOpen,
    destroy: () => {
      if (button) ["aria-expanded"].forEach(attr => button.removeAttribute(attr));
    },
  };
}



