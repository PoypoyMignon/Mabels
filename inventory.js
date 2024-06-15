import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

document.getElementById('add-button').addEventListener('click', function() {
    document.getElementById('menu-modal').style.display = 'block';
});

document.querySelector('.close-button').addEventListener('click', function() {
    document.getElementById('menu-modal').style.display = 'none';
});

window.addEventListener('click', function(event) {
    if (event.target == document.getElementById('menu-modal')) {
        document.getElementById('menu-modal').style.display = 'none';
    }
});

async function fetchInventoryItems() {
    const inventoryList = document.getElementById('inventory-list');
    inventoryList.innerHTML = '';
    const querySnapshot = await getDocs(collection(db, "menu"));
    querySnapshot.forEach((doc) => {
        const item = doc.data();
        const li = document.createElement('li');
        li.textContent = `${item.name} - ₱${item.price} (Category: ${item.category}, Available: ${item.quantity})`;

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-container';

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.onclick = () => deleteItem(doc.id);

        const updateButton = document.createElement('button');
        updateButton.textContent = 'Update';
        updateButton.onclick = () => populateMenuForm(doc.id, item);

        buttonContainer.appendChild(deleteButton);
        buttonContainer.appendChild(updateButton);

        li.appendChild(buttonContainer);
        inventoryList.appendChild(li);
    });
}

document.getElementById('menu-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const itemName = document.getElementById('item-name').value;
    const itemPrice = parseFloat(document.getElementById('item-price').value);
    const itemCategory = document.getElementById('item-category').value;
    const itemQuantity = parseInt(document.getElementById('item-quantity').value);

    try {
        if (updateItemId) {
            await updateMenuItem(updateItemId, { name: itemName, price: itemPrice, category: itemCategory, quantity: itemQuantity });
            updateItemId = null;
        } else {
            await addMenuItem({ name: itemName, price: itemPrice, category: itemCategory, quantity: itemQuantity });
        }

        fetchInventoryItems();
        document.getElementById('menu-modal').style.display = 'none';
        document.getElementById('menu-form').reset();
    } catch (e) {
        console.error("Error adding/updating menu item: ", e);
        alert("Error adding/updating menu item: " + e.message);
    }
});

async function addMenuItem(item) {
    try {
        await addDoc(collection(db, "menu"), item);
        alert("Menu item added successfully!");
    } catch (e) {
        console.error("Error adding menu item: ", e);
        alert("Error adding menu item: " + e.message);
    }
}

async function updateMenuItem(id, item) {
    try {
        const itemDoc = doc(db, "menu", id);
        await updateDoc(itemDoc, item);
        alert("Menu item updated successfully!");
    } catch (e) {
        console.error("Error updating menu item: ", e);
        alert("Error updating menu item: " + e.message);
    }
}

async function deleteItem(id) {
    try {
        await deleteDoc(doc(db, "menu", id));
        alert("Menu item deleted successfully!");
        fetchInventoryItems();
    } catch (e) {
        console.error("Error deleting menu item: ", e);
        alert("Error deleting menu item: " + e.message);
    }
}

function populateMenuForm(id, item) {
    document.getElementById('item-name').value = item.name;
    document.getElementById('item-price').value = item.price;
    document.getElementById('item-category').value = item.category;
    document.getElementById('item-quantity').value = item.quantity;
    updateItemId = id;
    document.getElementById('menu-modal').style.display = 'block';
}

fetchInventoryItems();
