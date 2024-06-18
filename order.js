import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getFirestore, collection, getDocs, updateDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC0ThHyyFDXYKeC3xdhGLw-TQXpSYUxaQg",
    authDomain: "poypoy-project.firebaseapp.com",
    projectId: "poypoy-project",
    storageBucket: "poypoy-project",
    messagingSenderId: "723931945160",
    appId: "1:723931945160:web:d00f7a8baf99dfc380adfd",
    measurementId: "G-2GL6D5LP6W"
};

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', async function() {
    const links = document.querySelectorAll('.pos-menu-item');
    const contentContainer = document.getElementById('content');
    const checkoutButton = document.getElementById('checkout-button');


    const categoryContent = await fetchAndOrganizeInventoryItems(db);

    links.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const category = this.getAttribute('data-category');
            if (categoryContent[category]) {
                contentContainer.innerHTML = categoryContent[category];
                addOrderListeners();
            } else {
                contentContainer.innerHTML = "<h2>Category not found</h2><p>No content available for this category.</p>";
            }
        });
    });

    checkoutButton.addEventListener('click', async function() {
        await checkoutOrder();
    });
});

async function fetchAndOrganizeInventoryItems(db) {
    const categoryContent = {};
    try {
        const querySnapshot = await getDocs(collection(db, "menu"));
        querySnapshot.forEach((doc) => {
            const item = doc.data();
            const category = item.category;
            if (!categoryContent[category]) {
                categoryContent[category] = `<h2>${category}</h2>`;
            }
            categoryContent[category] += `<div class="menu-item" data-id="${doc.id}" data-name="${item.name}" data-price="${item.price}" data-quantity="${item.quantity}">${item.name} - ₱${item.price} (Available: ${item.quantity})</div>`;
        });
    } catch (error) {
        console.error("Error fetching inventory items: ", error);
    }
    return categoryContent;
}

function addOrderListeners() {
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            const itemId = this.getAttribute('data-id');
            const itemName = this.getAttribute('data-name');
            const itemPrice = this.getAttribute('data-price');
            const itemQuantity = parseInt(this.getAttribute('data-quantity'));
            toggleQuantitySelector(itemId, itemName, itemPrice, itemQuantity);
        });
    });
}

function addToOrder(itemId, name, price, quantity) {
    const orderList = document.getElementById('order-list');
    const orderItem = document.createElement('li');
    orderItem.setAttribute('data-id', itemId);
    orderItem.setAttribute('data-quantity', quantity);
    
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.onclick = () => {
        orderItem.remove();
        updateTotalPrice();
    };

    const dineOption = document.createElement('select');
    dineOption.innerHTML = `
        <option value="Dine In">Dine In</option>
        <option value="Take Out">Take Out</option>
    `;
    dineOption.classList.add('dine-option');

    orderItem.textContent = `${name} - ₱${price} x ${quantity} `;
    orderItem.appendChild(dineOption);
    orderItem.appendChild(deleteButton);
    orderList.appendChild(orderItem);
    updateTotalPrice();
}

function updateTotalPrice() {
    const orderItems = document.querySelectorAll('#order-list li');
    let totalPrice = 0;
    orderItems.forEach(item => {
        const price = parseFloat(item.textContent.split(' - ₱')[1].split(' x ')[0]);
        const quantity = parseInt(item.textContent.split(' - ₱')[1].split(' x ')[1]);
        totalPrice += price * quantity;
    });
    document.getElementById('total-price').innerText = `Total: ₱${totalPrice.toFixed(2)}`;
}

function toggleQuantitySelector(itemId, itemName, itemPrice, itemQuantity) {
    const menuItem = document.querySelector(`.menu-item[data-id="${itemId}"]`);
    let quantityContainer = menuItem.querySelector('.quantity-container');

    if (!quantityContainer) {
        quantityContainer = document.createElement('div');
        quantityContainer.classList.add('quantity-container');

        const quantityInput = document.createElement('input');
        quantityInput.setAttribute('type', 'number');
        quantityInput.setAttribute('min', '1');
        quantityInput.setAttribute('value', '1');
        quantityInput.setAttribute('max', itemQuantity.toString());
        quantityInput.classList.add('quantity-input');

        const addToOrderButton = document.createElement('button');
        addToOrderButton.textContent = 'Add to Order';
        addToOrderButton.addEventListener('click', function() {
            const quantity = parseInt(quantityInput.value);
            if (quantity <= itemQuantity) {
                addToOrder(itemId, itemName, itemPrice, quantity);
                quantityContainer.remove();
            } else {
                alert("Quantity exceeds available stock.");
            }
        });

        quantityContainer.style.display = 'inline-flex';
        quantityContainer.style.alignItems = 'center';
        quantityContainer.style.marginLeft = '10px';

        quantityContainer.appendChild(quantityInput);
        quantityContainer.appendChild(addToOrderButton);

        menuItem.appendChild(quantityContainer);
    } else {
        if (!event.target.classList.contains('quantity-input') && !event.target.classList.contains('quantity-button')) {
            quantityContainer.remove();
        }
    }
}

async function checkoutOrder() {
    const orderItems = document.querySelectorAll('#order-list li');
    
    if (orderItems.length === 0) {
        alert("No orders selected. Please add items to your order before checking out.");
        return;
    }

    const updates = [];
    const orderDetails = [];
    
    const paymentMethod = document.getElementById('payment-method').value;

    for (const item of orderItems) {
        const itemId = item.getAttribute('data-id');
        const quantity = parseInt(item.getAttribute('data-quantity'));
        const dineOption = item.querySelector('.dine-option').value;
        
        // Fetch item details from Firestore
        const itemSnapshot = await getDoc(doc(db, "menu", itemId));
        if (itemSnapshot.exists()) {
            const itemData = itemSnapshot.data();
            orderDetails.push({
                id: itemId,
                name: itemData.name,
                category: itemData.category,
                quantity: quantity,
                option: dineOption,
                payment: paymentMethod
            });

            updates.push(updateInventoryQuantity(itemId, -quantity));
        }
    }

    try {
        await Promise.all(updates);

        // Save order details to the purchase history collection
        await saveOrderToHistory(orderDetails, paymentMethod);

        document.getElementById('order-list').innerHTML = '';
        updateTotalPrice();

        let orderSummary = `Order successfully checked out!\n\nOrder Details:\nPayment Method: ${paymentMethod}\n`;
        orderDetails.forEach(order => {
            orderSummary += `ID: ${order.id}, Name: ${order.name}, Category: ${order.category}, Quantity: ${order.quantity}, Option: ${order.option}\n`;
        });
        alert(orderSummary);
    } catch (error) {
        console.error("Error during checkout: ", error);
        alert("Error during checkout. Please try again.");
    }
}

async function saveOrderToHistory(orderDetails, paymentMethod) {
    try {
        const orderCollection = collection(db, "purchaseHistory");
        const timestamp = new Date();
        await addDoc(orderCollection, {
            timestamp: timestamp,
            orderDetails: orderDetails,
            paymentMethod: paymentMethod
        });
    } catch (error) {
        console.error("Error saving order to history: ", error);
    }
}

async function updateInventoryQuantity(itemId, quantityChange) {
    try {
        const itemDoc = doc(db, "menu", itemId);
        const itemSnapshot = await getDoc(itemDoc);
        if (itemSnapshot.exists()) {
            const currentQuantity = itemSnapshot.data().quantity;
            const newQuantity = currentQuantity + quantityChange;
            await updateDoc(itemDoc, { quantity: newQuantity });

            const menuItem = document.querySelector(`.menu-item[data-id="${itemId}"]`);
            if (menuItem) {
                menuItem.setAttribute('data-quantity', newQuantity);
                menuItem.innerHTML = `${itemSnapshot.data().name} - ₱${itemSnapshot.data().price} (Available: ${newQuantity})`;
            }
        }
    } catch (error) {
        console.error("Error updating inventory quantity: ", error);
    }
}
