import { state } from "../state.js";
import { foodCatalog } from "../data/foods.js";
import { saveGame } from "../storage.js";
import { formatMoney } from "../utils/format.js";
import { addUnique } from "../utils/helpers.js";
import { discoverFood } from "./journal.js";
import { checkVictory } from "./questSystem.js";
import { closeChoiceModal, openChoiceModal, openFoodInfoPanel, showMessage } from "./modal.js";

export function openShop(shop) {
  const food = foodCatalog[shop.foodId];
  const alreadyEaten = state.eatenFoods.includes(food.id);
  const body = `${food.name}\n${food.description}\nGiá: ${formatMoney(food.price)}`;

  openChoiceModal({
    tag: "Quán ăn",
    title: food.name,
    body,
    actions: [
      {
        label: alreadyEaten ? "Xem thông tin" : "Mua",
        className: "primary-choice",
        onClick: () => {
          if (alreadyEaten) {
            closeChoiceModal();
            openFoodInfoPanel(food, { alreadyDiscovered: true });
          } else {
            buyFood(food);
          }
        }
      },
      { label: "Rời đi", onClick: closeChoiceModal }
    ]
  });
}

export function buyFood(food) {
  if (state.eatenFoods.includes(food.id)) {
    showMessage(`Bạn đã thưởng thức ${food.name} rồi.`);
    closeChoiceModal();
    return;
  }

  if (state.money < food.price) {
    showMessage("Bạn chưa đủ tiền. Hãy làm nhiệm vụ hoặc trả lời câu hỏi để kiếm thêm VND.");
    closeChoiceModal();
    return;
  }

  state.money -= food.price;
  addUnique(state.eatenFoods, food.id);
  addUnique(state.inventory.foods, food.item);
  discoverFood(food.id);
  closeChoiceModal();
  saveGame();
  openFoodInfoPanel(food, { pricePaid: food.price });
  checkVictory();
}
