document.addEventListener("DOMContentLoaded", (event) => {
  const sortableList = document.getElementById("sortable-list");
  const saveStateCheckbox = document.getElementById("save-state");

  const saveListState = () => {
    const items = Array.from(sortableList.children).map(
      (item) => item.textContent
    );
    if (saveStateCheckbox.checked) {
      localStorage.setItem("sortableListState", JSON.stringify(items));
      localStorage.setItem("saveStateCheckbox", "checked");
    } else {
      localStorage.removeItem("sortableListState");
      localStorage.removeItem("saveStateCheckbox");
    }
  };

  const loadListState = () => {
    const savedState = localStorage.getItem("sortableListState");
    const saveStateCheckboxState = localStorage.getItem("saveStateCheckbox");

    if (saveStateCheckboxState === "checked") {
      saveStateCheckbox.checked = true;
      if (savedState) {
        const items = JSON.parse(savedState);
        sortableList.innerHTML = "";
        items.forEach((itemText) => {
          const item = document.createElement("li");
          item.className = "list-item";
          item.textContent = itemText;
          sortableList.appendChild(item);
        });
      }
    } else {
      saveStateCheckbox.checked = false;
      sortableList.innerHTML = `
                <li class="list-item">Item 1</li>
                <li class="list-item">Item 2</li>
                <li class="list-item">Item 3</li>
                <li class="list-item">Item 4</li>
                <li class="list-item">Item 5</li>
            `;
    }
  };

  loadListState();

  new Sortable(sortableList, {
    animation: 150,
    ghostClass: "sortable-ghost",
    onEnd: saveListState,
  });

  saveStateCheckbox.addEventListener("change", saveListState);
});
