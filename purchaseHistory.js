import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, updateDoc, deleteDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC0ThHyyFDXYKeC3xdhGLw-TQXpSYUxaQg",
    authDomain: "poypoy-project.firebaseapp.com",
    projectId: "poypoy-project",
    storageBucket: "poypoy-project.appspot.com",
    messagingSenderId: "723931945160",
    appId: "1:723931945160:web:d00f7a8baf99dfc380adfd",
    measurementId: "G-2GL6D5LP6W"
};

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let updateItemId = null;
let currentOrder = null; // Store the current order details

async function fetchPurchaseHistory() {
    try {
        const historyList = document.getElementById('history-list');
        historyList.innerHTML = '';
        const querySnapshot = await getDocs(collection(db, "purchaseHistory"));

        if (querySnapshot.empty) {
            console.log("No documents found in the purchaseHistory collection.");
            return;
        }

        querySnapshot.forEach((doc) => {
            const order = doc.data();
            console.log("Fetched order:", order); // Debugging: Log the order data

            const orderContainer = document.createElement('div');
            orderContainer.className = 'order-container';

            const orderDetailsDiv = document.createElement('div');
            orderDetailsDiv.className = 'order-details';

            const orderDetails = order.orderDetails; // Access orderDetails array
            const paymentMethod = order.paymentMethod || "N/A"; // Access paymentMethod

            orderDetails.forEach(detail => {
                orderDetailsDiv.innerHTML += `Name: ${detail.name || "N/A"} - Category: ${detail.category || "N/A"} - Quantity: ${detail.quantity || "N/A"} - Option: ${detail.option || "N/A"} - Payment: ${paymentMethod}<br>`;
            });

            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'button-container';

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.onclick = () => deleteOrder(doc.id);

            const updateButton = document.createElement('button');
            updateButton.textContent = 'Update';
            updateButton.onclick = () => populateUpdateForm(doc.id, order);

            buttonContainer.appendChild(deleteButton);
            buttonContainer.appendChild(updateButton);

            orderContainer.appendChild(orderDetailsDiv);
            orderContainer.appendChild(buttonContainer);
            historyList.appendChild(orderContainer);
        });
    } catch (error) {
        console.error("Error fetching purchase history:", error);
    }
}

document.addEventListener('DOMContentLoaded', fetchPurchaseHistory);

async function deleteOrder(id) {
    try {
        await deleteDoc(doc(db, "purchaseHistory", id));
        alert("Order deleted successfully!");
        fetchPurchaseHistory();
    } catch (e) {
        console.error("Error deleting order:", e);
        alert("Error deleting order: " + e.message);
    }
}

function populateUpdateForm(id, order) {
    currentOrder = order; // Store the current order details
    const itemList = document.getElementById('item-list');
    itemList.innerHTML = ''; // Clear the item list

    order.orderDetails.forEach((detail, index) => {
        const itemRow = document.createElement('div');
        itemRow.className = 'item-row';

        const nameLabel = document.createElement('span');
        nameLabel.textContent = `Name: ${detail.name || "N/A"} - Category: ${detail.category || "N/A"}`;
        itemRow.appendChild(nameLabel);

        const quantityInput = document.createElement('input');
        quantityInput.type = 'number';
        quantityInput.value = detail.quantity || "";
        quantityInput.dataset.index = index;
        itemRow.appendChild(quantityInput);

        const deleteItemButton = document.createElement('button');
        deleteItemButton.textContent = 'Delete';
        deleteItemButton.onclick = () => deleteItem(id, index);
        itemRow.appendChild(deleteItemButton);

        itemList.appendChild(itemRow);
    });

    document.getElementById('item-payment').value = order.paymentMethod || "";
    updateItemId = id;
    document.getElementById('menu-modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('menu-modal').style.display = 'none';
    document.getElementById('menu-form').reset();
}

document.getElementById('close-modal').addEventListener('click', closeModal);

document.getElementById('menu-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const updatedOrderDetails = [];
    const itemRows = document.querySelectorAll('#item-list .item-row');

    itemRows.forEach(row => {
        const index = row.querySelector('input[type="number"]').dataset.index;
        const quantity = row.querySelector('input[type="number"]').value;
        const name = row.querySelector('span').textContent.split(' - ')[0].replace('Name: ', '');

        updatedOrderDetails.push({
            name,
            quantity: parseInt(quantity),
            category: currentOrder.orderDetails[index].category,
            option: currentOrder.orderDetails[index].option,
        });
    });

    const updatedOrder = {
        orderDetails: updatedOrderDetails,
        paymentMethod: document.getElementById('item-payment').value,
    };

    try {
        await updateDoc(doc(db, "purchaseHistory", updateItemId), updatedOrder);
        await updateInventoryQuantities(updatedOrderDetails); // Update inventory quantities
        alert("Order updated successfully!");
        closeModal();
        fetchPurchaseHistory();
    } catch (e) {
        console.error("Error updating order:", e);
        alert("Error updating order: " + e.message);
    }
});

async function deleteItem(orderId, itemIndex) {
    const docRef = doc(db, "purchaseHistory", orderId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const order = docSnap.data();
        order.orderDetails.splice(itemIndex, 1);

        try {
            await updateDoc(docRef, order);
            alert("Item deleted successfully!");
            populateUpdateForm(orderId, order);
            fetchPurchaseHistory(); // Refresh the order list after deletion
        } catch (e) {
            console.error("Error deleting item:", e);
            alert("Error deleting item: " + e.message);
        }
    } else {
        console.log("No such document!");
    }
}

async function updateInventoryQuantities(orderDetails) {
    try {
        for (const detail of orderDetails) {
            const itemName = detail.name;
            const itemQuantity = detail.quantity;

            const inventoryRef = doc(db, "inventory", itemName);
            const inventorySnap = await getDoc(inventoryRef);

            if (inventorySnap.exists()) {
                const inventoryItem = inventorySnap.data();
                const updatedQuantity = inventoryItem.quantity - itemQuantity;

                await updateDoc(inventoryRef, { quantity: updatedQuantity });
            } else {
                console.log(`Item ${itemName} not found in inventory.`);
            }
        }
    } catch (e) {
        console.error("Error updating inventory quantities:", e);
        alert("Error updating inventory quantities: " + e.message);
    }
}
