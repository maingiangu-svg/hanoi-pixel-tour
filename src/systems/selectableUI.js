export function getSelectableButtons(container) {
  return Array.from(container.querySelectorAll("button"));
}

export function moveSelection(currentIndex, delta, total) {
  if (!total) {
    return 0;
  }

  return (currentIndex + delta + total) % total;
}

export function renderButtonSelection(buttons, selectedIndex, active = true) {
  buttons.forEach((button, index) => {
    const label = button.dataset.actionLabel || button.textContent.replace(/^▶\s*/, "").trim();
    button.dataset.actionLabel = label;
    const selected = active && index === selectedIndex;
    button.classList.toggle("is-selected", selected);
    button.textContent = selected ? `▶ ${label}` : label;
  });
}

export function activateSelectedButton(buttons, selectedIndex) {
  if (!buttons.length) {
    return false;
  }

  const index = moveSelection(selectedIndex, 0, buttons.length);
  const button = buttons[index];
  if (!button || button.disabled) {
    return false;
  }

  button.click();
  return true;
}
