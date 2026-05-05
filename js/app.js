// ============================
// Part 1: インポートと要素の取得
// ============================
import { db } from './firebase-config.js';
import { loginWithGoogle, logout, getCurrentUser, onAuthChange } from './auth.js';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const cardArea = document.getElementById('card-area');
const saveBtn = document.getElementById('btn-save');
const addBtn = document.getElementById('add-btn');
const cancelBtn = document.getElementById('btn-cancel');
const homePage = document.getElementById('home-page');
const addPage = document.getElementById('add-page');
const loginPage = document.getElementById('login-page');
const googleLoginBtn = document.getElementById('google-login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userInfo = document.getElementById('user-info');
const userPhoto = document.getElementById('user-photo');
const userName = document.getElementById('user-name');
const slidersIds = ['acidity', 'bitterness', 'richness', 'sweetness', 'aromaStrength'];

let editingDocId = null;
let unsubscribe = null;

// ============================
// Part 2: UI操作関数
// ============================
function switchPage(pageName) {
    if (pageName === 'add') {
        homePage.classList.add('hidden');
        addPage.classList.remove('hidden');
    } else {
        addPage.classList.add('hidden');
        homePage.classList.remove('hidden');
    }
}

function logDate(timestamp) {
    if (!timestamp) return '日付なし';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
}

function resetForm() {
    document.getElementById('product-name').value = "";
    document.getElementById('country').value = "";
    document.getElementById('farm').value = "";
    document.getElementById('variety').value = "";
    document.getElementById('aroma').value = "";
    document.getElementById('process').value = "";
    document.getElementById('dripper').value = "";
    document.getElementById('shop').value = "";
    document.getElementById('memo').value = "";
    slidersIds.forEach(function(id) {
        const slider = document.getElementById(id);
        slider.value = 3;
        document.getElementById(id + '-value').textContent = 3;
    });
}

// ============================
// Part 3: カード描画（投稿者情報を追加）
// ============================
function renderCard(docId, log) {
    const currentUser = getCurrentUser();
    const isOwner = currentUser && currentUser.uid === log.userId;
    const displayName = log.productName || '名称未設定';

    const cardHtml = `
        <div class="glass-card" data-id="${docId}">
            <div class="card-header">
                <div>
                    <div class="post-user-info">
                        <img class="post-user-photo" src="${log.userPhoto || ''}" alt="">
                        <span class="post-user-name">${log.userName || '匿名'}</span>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h3>${displayName}</h3>
                    </div>

                    <div class="meta-info">
                        <span><i data-lucide="calendar"></i> ${logDate(log.createdAt)}</span>
                    </div>

                    <div class="meta-info">
                        <span><i data-lucide="map-pin"></i> ${log.country}</span>
                        <span>/</span>
                        <span><i data-lucide="tree-deciduous"></i>${log.farm || '未登録'}</span>
                    </div>

                    <div class="meta-info" style="margin-top: 4px;">
                        <span><i data-lucide="sprout"></i> ${log.variety}</span>
                    </div>

                    <div class="meta-info" style="margin-top: 4px;">
                        <span><i data-lucide="droplets"></i> ${log.process || '未記録'}</span>
                        <span>/</span>
                        <span><i data-lucide="filter"></i> ${log.dripper || '未登録'}</span>
                    </div>

                    <div class="meta-info" style="margin-top: 4px;">
                        <span><i data-lucide="shopping-bag"></i> ${log.shop || '未登録'}</span>
                    </div>

                    <div class="meta-info" style="margin-top: 4px;">
                        <span><i data-lucide="message-square"></i> ${log.aroma || '未登録'}</span>
                    </div>
                </div>
            </div>

            <p class="notes"><i data-lucide="sticky-note"></i> ${log.note || 'メモなし'}</p>
            <div class="chart-container">
                <canvas id="chart-${docId}"></canvas>
            </div>

            <div class="card-footer">
                <button class="action-btn favorite-btn ${log.isFavorite ? 'active' : ''}" data-id="${docId}">
                    <i data-lucide="star"></i>
                    <span>${log.isFavorite ? 'お気に入り' : 'お気に入りに追加'}</span>
                </button>
                ${isOwner ? `
                    <button class="action-btn edit-btn" data-id="${docId}">
                        <i data-lucide="edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${docId}">
                        <i data-lucide="trash-2"></i>
                    </button>
                ` : ''}
            </div>
        </div>
    `;

    cardArea.insertAdjacentHTML('beforeend', cardHtml);
    initChart(docId, log.flavor);
}

// ============================
// Part 4: レーダーチャート
// ============================
function initChart(id, flavor) {
    const ctx = document.getElementById(`chart-${id}`).getContext('2d');
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Acidity', 'Bitterness', 'Body', 'Sweetness', 'Aroma'],
            datasets: [{
                label: 'Flavor Profile',
                data: [
                    flavor.acidity,
                    flavor.bitterness,
                    flavor.richness,
                    flavor.sweetness,
                    flavor.aromaStrength
                ],
                backgroundColor: 'rgba(153, 208, 144, 0.2)',
                borderColor: 'rgb(168, 216, 181)',
                borderWidth: 2,
                pointBackgroundColor: 'white'
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    min: 0,
                    max: 5,
                    ticks: {
                        stepSize: 1,
                        color: '#a0a0a0',
                        backdropColor: 'transparent',
                        display: false
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    pointLabels: { color: '#ffffff', font: { size: 12 } },
                    angleLines: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            },
            plugins: { legend: { display: false } }
        }
    });
    lucide.createIcons();
}

// ============================
// Part 5: Firestore連携関数
// ============================
function startRealtimeListener() {
    const q = query(collection(db, 'coffeeLogs'), orderBy('createdAt', 'desc'));

    unsubscribe = onSnapshot(q, (snapshot) => {
        cardArea.innerHTML = '';
        snapshot.forEach((docSnap) => {
            renderCard(docSnap.id, docSnap.data());
        });
    });
}

function stopRealtimeListener() {
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
    }
}

// ============================
// Part 6: 認証状態による画面切り替え
// ============================
onAuthChange((user) => {
    if (user) {
        loginPage.classList.add('hidden');
        homePage.classList.remove('hidden');
        userInfo.classList.remove('hidden');
        userPhoto.src = user.photoURL || '';
        userName.textContent = user.displayName || 'ユーザー';
        startRealtimeListener();
    } else {
        loginPage.classList.remove('hidden');
        homePage.classList.add('hidden');
        addPage.classList.add('hidden');
        userInfo.classList.add('hidden');
        cardArea.innerHTML = '';
        stopRealtimeListener();
    }
    lucide.createIcons();
});

// ============================
// Part 7: イベントリスナー
// ============================
googleLoginBtn.addEventListener('click', () => {
    loginWithGoogle().catch((error) => {
        console.error('ログインエラー:', error);
        alert('ログインに失敗しました。もう一度お試しください。');
    });
});

logoutBtn.addEventListener('click', () => {
    logout();
});

addBtn.addEventListener('click', () => {
    switchPage('add');
    resetForm();
    editingDocId = null;
});

cancelBtn.addEventListener('click', () => {
    switchPage('home');
    resetForm();
    editingDocId = null;
});

slidersIds.forEach(function(id) {
    const slider = document.getElementById(id);
    const valueSpan = document.getElementById(id + '-value');
    slider.addEventListener('input', function() {
        valueSpan.textContent = slider.value;
    });
});

saveBtn.addEventListener('click', async function() {
    const productName = document.getElementById('product-name').value;
    const country = document.getElementById('country').value;
    const farm = document.getElementById('farm').value;
    const variety = document.getElementById('variety').value;
    const aroma = document.getElementById('aroma').value;
    const process = document.getElementById('process').value;
    const dripper = document.getElementById('dripper').value;
    const shop = document.getElementById('shop').value;
    const note = document.getElementById('memo').value;

    const acidity = Number(document.getElementById('acidity').value);
    const bitterness = Number(document.getElementById('bitterness').value);
    const richness = Number(document.getElementById('richness').value);
    const sweetness = Number(document.getElementById('sweetness').value);
    const aromaStrength = Number(document.getElementById('aromaStrength').value);

    if (!productName || !country || !process || !variety || !aroma) {
        alert("入力が不完全です。必須項目を入力してください。");
        return;
    }

    const user = getCurrentUser();
    const logData = {
        userId: user.uid,
        userName: user.displayName || '匿名',
        userPhoto: user.photoURL || '',
        productName,
        country,
        farm,
        variety,
        aroma,
        process,
        dripper,
        shop,
        note,
        isFavorite: false,
        flavor: { acidity, bitterness, richness, sweetness, aromaStrength }
    };

    try {
        if (editingDocId) {
            logData.updatedAt = serverTimestamp();
            await updateDoc(doc(db, 'coffeeLogs', editingDocId), logData);
            editingDocId = null;
        } else {
            logData.createdAt = serverTimestamp();
            await addDoc(collection(db, 'coffeeLogs'), logData);
        }
        resetForm();
        switchPage('home');
    } catch (error) {
        console.error('保存エラー:', error);
        alert('保存に失敗しました。');
    }
});

cardArea.addEventListener('click', async function(e) {
    const deleteBtn = e.target.closest('.delete-btn');
    const favoriteBtn = e.target.closest('.favorite-btn');
    const editBtn = e.target.closest('.edit-btn');

    if (favoriteBtn) {
        const docId = favoriteBtn.dataset.id;
        const isActive = favoriteBtn.classList.contains('active');
        try {
            await updateDoc(doc(db, 'coffeeLogs', docId), {
                isFavorite: !isActive
            });
        } catch (error) {
            console.error('お気に入り更新エラー:', error);
        }
    } else if (deleteBtn) {
        const docId = deleteBtn.dataset.id;
        openModal("削除の確認", "本当に削除しますか？", async function() {
            try {
                await deleteDoc(doc(db, 'coffeeLogs', docId));
            } catch (error) {
                console.error('削除エラー:', error);
            }
        });
    } else if (editBtn) {
        const docId = editBtn.dataset.id;

        try {
            const snapshot = await getDoc(doc(db, 'coffeeLogs', docId));

            if (snapshot.exists()) {
                const data = snapshot.data();
                document.getElementById('product-name').value = data.productName || '';
                document.getElementById('country').value = data.country || '';
                document.getElementById('farm').value = data.farm || '';
                document.getElementById('variety').value = data.variety || '';
                document.getElementById('aroma').value = data.aroma || '';
                document.getElementById('process').value = data.process || '';
                document.getElementById('dripper').value = data.dripper || '';
                document.getElementById('shop').value = data.shop || '';
                document.getElementById('memo').value = data.note || '';

                document.getElementById('acidity').value = data.flavor.acidity;
                document.getElementById('bitterness').value = data.flavor.bitterness;
                document.getElementById('richness').value = data.flavor.richness;
                document.getElementById('sweetness').value = data.flavor.sweetness;
                document.getElementById('aromaStrength').value = data.flavor.aromaStrength;

                document.getElementById('acidity-value').textContent = data.flavor.acidity;
                document.getElementById('bitterness-value').textContent = data.flavor.bitterness;
                document.getElementById('richness-value').textContent = data.flavor.richness;
                document.getElementById('sweetness-value').textContent = data.flavor.sweetness;
                document.getElementById('aromaStrength-value').textContent = data.flavor.aromaStrength;

                editingDocId = docId;
                switchPage('add');
            }
        } catch (error) {
            console.error('編集データ取得エラー:', error);
        }
    }
});
