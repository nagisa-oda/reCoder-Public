// インポートと要素の取得
import {db} from './firebase-config.js';
import {loginWithGoogle, logout, getCurrentUser, onAuthChange, getCurrentUser} from './auth.js';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";




const cardArea = document.getElementById('card-area');
const saveBtn = document.getElementById('btn-save');
const addBtn = document.getElementById('add-btn');
const cancelBtn = document.getElementById('btn-cancel');
const editBtn = document.getElementById('edit-btn');
const homePage = document.getElementById('home-page');
const addPage = document.getElementById('add-page');
const slidersIds = ['acidity', 'bitterness', 'richness', 'sweetness', 'aromaStrength'];

// コーヒーの記録を保存するためのリスト
let coffeeLogs = [];
// 編集中のデータを管理するための変数
let editingId = null;

let editingDocId = null;
let unsubscribe = null;

// UI操作関数
// ページ遷移処理
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
    if(!timestamp) return '日付なし';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const year = date.getFullyear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
}

// フォームのリセット処理
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

// カードを描画する処理(投稿者情報を追加)
function renderCard(log) {
    // 既存データとの互換性のため、beanNameがあればproductNameとして扱う
    const getCurrentUser = getCurrentUser();
    const isOwner = getCurrentUser && getCurrentUser.uid === log.userId;
    const displayName = log.productName || log.beanName || '名称未設定';

    const cardHtml = /*html*/`
        <div class="glass-card" data-id="${log.id}">
            <div class="card-header">
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h3>${displayName}</h3>
                    </div>
                    
                    <!---購入日--->
                    <div class = "meta-info">
                        <span><i data-lucide = "calendar"></i> ${logDate(log.id)}</span>
                    </div>

                    <!---生産国および農園--->
                    <div class="meta-info">
                        <span><i data-lucide="map-pin"></i> ${log.country}</span>
                        <span>/</span>
                        <span><i data-lucide="tree-deciduous"></i>${log.farm}</span>
                    </div>

                    <!---品種--->
                    <div class="meta-info" style="margin-top: 4px;">
                        <span><i data-lucide="sprout"></i> ${log.variety}</span>
                    </div>

                    <!---プロセスと使ったドリッパー--->
                    <div class="meta-info" style="margin-top: 4px;">
                        <span><i data-lucide="droplets"></i> ${log.process || '未記録'}</span>
                        <span>/</span>
                        <span><i data-lucide="filter"></i> ${log.dripper || '未登録'}</span>
                    </div>

                    <!---購入店--->
                    <div class="meta-info" style="margin-top: 4px;">
                        <span><i data-lucide="shopping-bag"></i> ${log.shop || '未登録'}</span>
                    </div>

                    <div class = "meta-info" style = "margin-top: 4px;">
                        <span><i data-lucide = "message-square"></i> ${log.aroma || '未登録'}</span>
                    </div>
                </div>
            </div>

            <p class="notes"><i data-lucide="sticky-note"></i> ${log.note || 'メモなし'}</p>
            <div class = "chart-container">
                <canvas id = "chart-${log.id}"></canvas>
            </div>

            <div class="card-footer">
                <button class="action-btn favorite-btn ${log.isFavorite ? 'active' : ''}" data-id="${log.id}">
                    <i data-lucide="star"></i>
                    <span>${log.isFavorite ? 'お気に入り' : 'お気に入りに追加'}</span>
                </button>

                ${isOwner ? `
                    <button class = "action-btn edit-btn" data-id = "${docId}"> 
                        <i data-lucide = "edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id = "${docId}">
                        <i data-lucide="trash-2"></i>
                    </button>
                ` : ''}
            </div>
        </div>
    `;

    // 画面に追加する
    cardArea.insertAdjacentHTML('afterbegin', cardHtml);
    // チャートの初期化
    initChart(log.id, log.flavor);
}

// レーダーチャートの初期化処理
function initChart(id, flavor) {
    const ctx = document.getElementById(`chart-${id}`).getContext('2d');
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Acidity', 'Bitterness', 'Body', 'Sweetness', 'Aroma'],
            datasets: [
                {
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
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    pointLabels: {
                        color: '#ffffff',
                        font: {
                            size: 12
                        }
                    },
                    angleLines: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });

    lucide.createIcons();
}


// Firestore連携関数
function startRealtimeListener() {
    const q = query(collection(db, 'coffeeLogs'), orderBy('createdAt', 'desc'));
    // db: 自分のFirebaseデータベースの中にあるcoffeeLogsというコレクションへの参照を取得
    // OrderBy:('createdAt', 'desc'): createdAtフィールドで降順(desc)に並べる
    // query(コレクション参照, 並び順): 上記二つを組み合わせてクエリ(問い合わせ)を作る
    // 結果、CoffeeLogsコレクションのデータを、作成日が新しい順に取得するというクエリを作成する。 
    unsubscribe = onSnapshot(q, (snapshot) => { // onSnapshot(クエリ, コールバック関数)は常にFirestoreを監視し続け、データが変わるたびにコールバック関数が呼ばれる
        // unsubscribeに代入している理由：onSnapshotは監視を止める関数を返すため、ログアウト時にこれを呼ぶことで監視を停止できる。
        cardArea.innerHTML = ''; // コールバックが呼ばれるたびに既存のカードを全て消す。全件再描画することでシンプルな設計にしている
        snapshot.forEach((docSnap) => { // docSnap: 1件のドキュメント(1つのコーヒーログ)
            renderCard(docSnap.id, docSnap.data()); // docSnap.date(): ドキュメントの中身をJavaScriptオブジェクトとして取得({productName: "...", country: "...", ...})
        });
    });
}

// Firestore監視停止用の関数(ログアウト時に呼ぶ)
function stopRealtimeListener() {
    if (unsubscribe) { // unsubscribeがTrueになることで(onSnapshot()が返した「監視停止関数」を呼ぶことで)、Firestoreの監視を止める
        unsubscribe();
        unsubscribe = null; // 二重にunsubscribe()を呼ばないための安全策
    }
}

// 現在の認証状態による画面切り替えを行う関数
onAuthChange((user) => {  // onAuthChange: インポートしたモジュール。ログイン/ログアウトが起きるたびにコールバックを呼ぶ関数

    /* ページを開いたとき、以前ログインしていればブラウザがセッション情報を覚えているため、userにユーザー情報が入る。
    　 初回ログイン時にはuserにはnullが入る。
       ログインしたとき、userにはGoogleアカウントの情報が入る。
       ログアウト時にはuserはnullになる。*/
    
    /* Googleログイン後、userには以下のようなプロパティが入る。
     user = {
    uid: "abc123xyz...",          // Firebase が割り当てた一意のユーザーID
    displayName: "田中太郎",       // Googleアカウントの表示名
    email: "tanaka@gmail.com",    // メールアドレス
    photoURL: "https://lh3...",   // Googleアカウントのプロフィール画像URL
    // ... その他多数のプロパティ
    }*/

    if(user) {
        loginPage.classList.add('hidden');
        homePage.classList.remove('hidden');
        userInfo.classList.remove('hidden');
        userPhoto.src = user.photoURL || '';
        userName.textContent = user.displayName || 'ユーザー';
        startRealtimeListener(); // Firestoreのリアルタイム監視を開始
    } else {
        loginPage.classList.remove('hidden');
        homePage.classList.add('hidden');
        addPage.classList.add('hidden');
        userInfo.classList.add('hidden');
        cardArea.innerHTML = '';
        stopRealtimeListener();  // Firestoreのリアルタイム監視を停止
    }
    lucide.createIcons();  // アイコン表示のため
})

// イベントリスナー群

// 追加ボタン：新規入力画面へ遷移
addBtn.addEventListener('click', function() {
    switchPage('add');
    resetForm();
    editingId = null;
});

// キャンセルボタン：ホーム画面へ戻る
cancelBtn.addEventListener('click', function() {
    switchPage('home');
    resetForm();
    editingId = null;
});

// スライダーの値をリアルタイムで更新
slidersIds.forEach(function(id) {
    const slider = document.getElementById(id);
    const spanId = id + '-value';
    const valueSpan = document.getElementById(spanId);
    slider.addEventListener('input', function() {
        valueSpan.textContent = slider.value;
    });
});

// 保存ボタン：データの追加・更新処理
saveBtn.addEventListener('click', function() {
    // HTMLから値を取得
    const productName = document.getElementById('product-name').value;
    const country = document.getElementById('country').value;
    const farm = document.getElementById('farm').value;
    const variety = document.getElementById('variety').value;
    const aroma = document.getElementById('aroma').value;
    const process = document.getElementById('process').value;
    const dripper = document.getElementById('dripper').value;
    const shop = document.getElementById('shop').value;
    const note = document.getElementById('memo').value;
    
    // スライダーの値を取得
    const acidity = document.getElementById('acidity').value;
    const bitterness = document.getElementById('bitterness').value;
    const richness = document.getElementById('richness').value;
    const sweetness = document.getElementById('sweetness').value;
    const aromaStrength = document.getElementById('aromaStrength').value;

    // バリデーション
    if (!productName || !country || !process || !variety || !aroma) {
        alert("入力が不完全です。必須項目を入力してください。");
        return;
    }

    // 1件分の記録データを作成
    const log = {
        id: Date.now(),
        productName: productName,
        country: country,
        farm: farm,
        variety: variety,
        aroma: aroma,
        process: process,
        dripper: dripper,
        shop: shop,
        note: note,
        isFavorite: false,
        flavor: {
            acidity: acidity,
            bitterness: bitterness,
            richness: richness,
            sweetness: sweetness,
            aromaStrength: aromaStrength
        }
    };

    // 編集モードか新規追加モードかで処理を分岐
    if (editingId) {
        // 編集モード
        const index = coffeeLogs.findIndex(log => log.id === editingId);
        log.id = editingId;
        log.isFavorite = coffeeLogs[index].isFavorite;
        coffeeLogs[index] = log;

        const oldCard = document.querySelector(`[data-id="${editingId}"]`).closest('.glass-card');
        if (oldCard) {
            oldCard.remove();
        }
        editingId = null;
    } else {
        // 新規追加モード
        coffeeLogs.push(log);
    }

    // LocalStorageに保存
    syncStorage();
    renderCard(log);
    resetForm();
    switchPage('home');
}, false);



// カードエリアのイベント委譲（削除、いいね、編集）
cardArea.addEventListener('click', function(e) {
    // イベントが発生したhtml要素の最も近い親要素を取得
    const deleteBtn = e.target.closest('.delete-btn');
    const favoriteBtn = e.target.closest('.favorite-btn');
    const editBtn = e.target.closest('.edit-btn');

    if (favoriteBtn) {
        const favoriteId = Number(favoriteBtn.dataset.id); //dataset.idはhtml要素のdata-id属性の値を取得
        const targetLog = coffeeLogs.find(log => log.id === favoriteId);

        if (targetLog) {
            targetLog.isFavorite = !targetLog.isFavorite;
            syncStorage();
            
            // ボタンの表示を更新
            const buttonTextSpan = favoriteBtn.querySelector('span');
            const buttonIcon = favoriteBtn.querySelector('i');
            
            if (targetLog.isFavorite) {
                favoriteBtn.classList.add('active'); 
                if (buttonTextSpan) {
                    buttonTextSpan.textContent = 'お気に入り';
                }
            } else {
                favoriteBtn.classList.remove('active');
                if (buttonTextSpan) {
                    buttonTextSpan.textContent = 'お気に入りに追加';
                }
            }
            
            // アイコンを再描画
            lucide.createIcons();
        }
    }
    // 削除ボタンの処理
    else if (deleteBtn) {
        const docId = deleteBtn.dataset.id;
        openModal("確認","本当に削除しますか？", async function() {
            try {
                await deleteDoc(doc(db, 'coffeeLogs', docId));
            } catch (error) {
                console.error('削除エラー:', error);
            }
        }
    });

    // 編集ボタンの処理
    else if (editBtn) {
        const targetId = Number(editBtn.dataset.id);
        const targetLog = coffeeLogs.find(log => log.id === targetId);
        if (!targetLog) {
            return;
        }

        // フォームにデータを設定
        document.getElementById('product-name').value = targetLog.productName;
        document.getElementById('country').value = targetLog.country;
        document.getElementById('farm').value = targetLog.farm;
        document.getElementById('variety').value = targetLog.variety;
        document.getElementById('aroma').value = targetLog.aroma;
        document.getElementById('process').value = targetLog.process;
        document.getElementById('dripper').value = targetLog.dripper;
        document.getElementById('shop').value = targetLog.shop;
        document.getElementById('memo').value = targetLog.note || '';

        // スライダーの値と表示を設定
        document.getElementById('acidity').value = targetLog.flavor.acidity;
        document.getElementById('bitterness').value = targetLog.flavor.bitterness;
        document.getElementById('richness').value = targetLog.flavor.richness;
        document.getElementById('sweetness').value = targetLog.flavor.sweetness;
        document.getElementById('aromaStrength').value = targetLog.flavor.aromaStrength;

        document.getElementById('acidity-value').textContent = targetLog.flavor.acidity;
        document.getElementById('bitterness-value').textContent = targetLog.flavor.bitterness;
        document.getElementById('richness-value').textContent = targetLog.flavor.richness;
        document.getElementById('sweetness-value').textContent = targetLog.flavor.sweetness;
        document.getElementById('aromaStrength-value').textContent = targetLog.flavor.aromaStrength;

        editingId = targetId;
        switchPage('add');
    }
});

// ========================================
// 5. 初期化処理
// ========================================

// ページ読み込み時にLocalStorageからデータを復元
const savedLogs = localStorage.getItem('coffeeLogs');
if (savedLogs) {
    coffeeLogs = JSON.parse(savedLogs);
    
    // 既存データに isFavorite フィールドを追加（互換性処理）
    coffeeLogs = coffeeLogs.map(log => ({
        ...log,
        isFavorite: log.isFavorite !== undefined ? log.isFavorite : false
    }));
    
    coffeeLogs.forEach(function(log) {
        renderCard(log);
    });
}