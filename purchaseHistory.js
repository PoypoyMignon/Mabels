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

            const li = document.createElement('li');
            const orderDetails = order.orderDetails; // Access orderDetails array
            const paymentMethod = order.paymentMethod || "N/A"; // Access paymentMethod
            
            orderDetails.forEach(detail => {
                li.innerHTML += `Name: ${detail.name || "N/A"} - Category: ${detail.category || "N/A"} - Quantity: ${detail.quantity || "N/A"} - Option: ${detail.option || "N/A"} - Payment: ${paymentMethod}<br>`;
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

            li.appendChild(buttonContainer);
            historyList.appendChild(li);
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
    const firstDetail = order.orderDetails[0]; // Assume we are updating the first detail
    document.getElementById('item-name').value = firstDetail.name || "";
    document.getElementById('item-category').value = firstDetail.category || "";
    document.getElementById('item-quantity').value = firstDetail.quantity || "";
    document.getElementById('item-payment').value = order.paymentMethod || "";
    updateItemId = id;
    document.getElementById('menu-modal').style.display = 'block';
}

document.getElementById('menu-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const itemName = document.getElementById('item-name').value;
    const itemCategory = document.getElementById('item-category').value;
    const itemQuantity = parseInt(document.getElementById('item-quantity').value);
    const itemPayment = document.getElementById('item-payment').value;

    try {
        if (updateItemId) {
            await updateOrder(updateItemId, itemName, itemCategory, itemQuantity, itemPayment);
            updateItemId = null;
        }

        fetchPurchaseHistory();
        document.getElementById('menu-modal').style.display = 'none';
        document.getElementById('menu-form').reset();
    } catch (e) {
        console.error("Error updating order:", e);
        alert("Error updating order: " + e.message);
    }
});

async function updateOrder(id, name, category, quantity, payment) {
    try {
        const orderDocRef = doc(db, "purchaseHistory", id);
        const orderDocSnap = await getDoc(orderDocRef);
        if (orderDocSnap.exists()) {
            const order = orderDocSnap.data();
            order.orderDetails[0].name = name;
            order.orderDetails[0].category = category;
            order.orderDetails[0].quantity = quantity;
            order.paymentMethod = payment;
            await updateDoc(orderDocRef, order);
            alert("Order updated successfully!");
        } else {
            console.error("No such document!");
            alert("No such document!");
        }
    } catch (e) {
        console.error("Error updating order:", e);
        alert("Error updating order: " + e.message);
    }
}
