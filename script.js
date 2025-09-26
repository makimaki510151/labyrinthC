// JavaScript
const setupSection = document.getElementById('setup-section');
const paletteSection = document.getElementById('palette-section');
const gridSizeInput = document.getElementById('grid-size');
const generateBtn = document.getElementById('generate-btn');
const gridContainer = document.getElementById('grid-container');
const colorButtons = document.querySelectorAll('.color-button');
const outputBtn = document.getElementById('output-btn');
const resetBtn = document.getElementById('reset-btn');
const undoBtn = document.getElementById('undo-btn');
const outputArea = document.getElementById('output-area');
const dotOutput = document.getElementById('dot-output');

let gridSize = 0;
let selectedColor = 'black'; // 初期選択色
let isDrawing = false; // マウスボタンが押されている状態を管理

// Undo機能のための変数
const history = []; // 履歴スタック
const maxHistory = 30; // 保持する履歴の最大数
// isNewDrawOperation は不要になったため削除

// ------------------------------------------
// Undo履歴管理機能
// ------------------------------------------

/**
 * 現在のグリッドの状態（各セルの色クラス名）を取得し、履歴に保存する
 */
function recordHistory() {
    const cells = gridContainer.querySelectorAll('.cell');
    const state = Array.from(cells).map(cell => {
        const colorClass = Array.from(cell.classList).find(c => c.startsWith('color-'));
        return colorClass ? colorClass.replace('color-', '') : 'black';
    });

    // 履歴の上限チェック
    if (history.length >= maxHistory) {
        history.shift(); // 最も古い履歴を削除
    }

    history.push(state);
    updateUndoButtonState();
}

/**
 * 履歴を元にグリッドの状態を復元する
 */
function undo() {
    if (history.length <= 1) { // 最初の状態（初期グリッド）は残しておく
        return;
    }

    // 最新の状態をポップ（描画前の状態に戻す）
    history.pop(); 
    
    // 復元する状態（現在の最新）を取得
    const previousState = history[history.length - 1];
    const cells = gridContainer.querySelectorAll('.cell');

    cells.forEach((cell, index) => {
        const newColor = previousState[index];
        // 全ての色クラスを削除
        cell.classList.remove('color-blue', 'color-red', 'color-white', 'color-black');
        // 復元する色クラスを追加
        cell.classList.add(`color-${newColor}`);
    });

    updateUndoButtonState();
}

/**
 * Undoボタンの有効/無効状態を更新
 */
function updateUndoButtonState() {
    // 履歴が最初の状態（初期化直後）より多ければ有効にする
    undoBtn.disabled = history.length <= 1;
}

// ------------------------------------------
// 塗りつぶし実行関数
// ------------------------------------------

function applyColor(cell) {
    const currentColor = Array.from(cell.classList).find(c => c.startsWith('color-'))?.replace('color-', '');

    // 既に同じ色なら塗らない
    if (currentColor === selectedColor) {
        return false; // 塗らなかった
    }

    // 現在の全色クラスを削除
    cell.classList.remove('color-blue', 'color-red', 'color-white', 'color-black');
    // 選択されている色クラスを追加
    cell.classList.add(`color-${selectedColor}`);
    
    return true; // 塗った
}

// ------------------------------------------
// イベントハンドラー (長押し対応)
// ------------------------------------------

// セルのクリック（長押し開始）と塗りつぶし
function handleCellInteraction(event) {
    // マウスの左ボタン (0) のみ、またはタッチイベントを対象とする
    const isLeftClickOrTouch = (event.type === 'mousedown' && event.button === 0) || 
                               (event.type === 'touchstart');

    if (isLeftClickOrTouch) {
        // 新しい描画操作の開始
        if (!isDrawing) {
            // isDrawingがfalseの時（つまり最初のクリック/タッチ時）のみ履歴を記録
            recordHistory(); 
        }
        isDrawing = true;

        applyColor(event.currentTarget); // 最初のセルを塗る
    }
    // マウスオーバー（ドラッグ中）の塗りつぶし
    else if (event.type === 'mouseover' || event.type === 'touchmove') {
        if (isDrawing && event.currentTarget.classList.contains('cell')) {
            // isDrawingがtrue（長押し中）で、かつ対象がセルであれば塗る
            applyColor(event.currentTarget);
        }
    }
}

/**
 * 描画モードの終了 (マウスボタンが離れたら必ず実行)
 */
function stopDrawing() {
    if (isDrawing) {
        isDrawing = false; // 描画状態をリセット
    }
}

// ------------------------------------------
// マス目生成機能
// ------------------------------------------

function createGrid() {
    gridSize = parseInt(gridSizeInput.value, 10);
    if (isNaN(gridSize) || gridSize < 1) {
        alert('有効なサイズ（1以上の数値）を入力してください。');
        return;
    }

    // UI切り替え
    setupSection.classList.add('hidden');
    paletteSection.classList.remove('hidden');
    outputArea.classList.add('hidden'); // 出力エリアを非表示に

    gridContainer.innerHTML = '';
    // パレットのマスのサイズをCSS Gridで設定
    gridContainer.style.gridTemplateColumns = `repeat(${gridSize}, 30px)`;

    // 履歴をリセット
    history.length = 0; 
    isDrawing = false;

    // 全てのマスを黒で初期化
    for (let i = 0; i < gridSize * gridSize; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell', 'color-black'); // 初期色は黒
        cell.dataset.index = i;

        cell.addEventListener('mousedown', handleCellInteraction);
        cell.addEventListener('mouseover', handleCellInteraction);

        cell.addEventListener('touchstart', handleCellInteraction);
        cell.addEventListener('touchmove', handleCellInteraction);

        gridContainer.appendChild(cell);
    }
    
    // 初期状態を履歴に記録
    recordHistory(); 
}

// ------------------------------------------
// カラーパレットと塗りつぶし機能
// ------------------------------------------

function handleColorSelection(event) {
    colorButtons.forEach(btn => btn.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
    selectedColor = event.currentTarget.dataset.color;
}

// カラーボタンにイベントリスナーを設定
colorButtons.forEach(button => {
    button.addEventListener('click', handleColorSelection);
});

// ------------------------------------------
// 出力表示とダウンロード機能 (変更なし)
// ------------------------------------------

function outputDotPattern() {
    outputArea.classList.remove('hidden');
    dotOutput.innerHTML = '';
    const displayDotSize = 1; 
    dotOutput.style.gridTemplateColumns = `repeat(${gridSize}, ${displayDotSize}px)`;
    dotOutput.style.width = `${gridSize * displayDotSize}px`;
    dotOutput.style.height = `${gridSize * displayDotSize}px`;

    const cells = gridContainer.querySelectorAll('.cell');
    cells.forEach(cell => {
        const dot = document.createElement('div');
        dot.classList.add('dot-cell');
        dot.style.width = `${displayDotSize}px`;
        dot.style.height = `${displayDotSize}px`;

        const colorClass = Array.from(cell.classList).find(c => c.startsWith('color-'));
        if (colorClass) {
            const color = colorClass.replace('color-', '');
            dot.style.backgroundColor = color;
        }

        dotOutput.appendChild(dot);
    });
    downloadOutput();
}

function downloadOutput() {
    const canvas = document.createElement('canvas');
    const downloadDotSize = 1;
    canvas.width = gridSize * downloadDotSize;
    canvas.height = gridSize * downloadDotSize;
    const ctx = canvas.getContext('2d');

    const cells = gridContainer.querySelectorAll('.cell');

    cells.forEach((cell, index) => {
        const row = Math.floor(index / gridSize);
        const col = index % gridSize;

        const colorClass = Array.from(cell.classList).find(c => c.startsWith('color-'));
        let color = 'black';
        if (colorClass) {
            color = colorClass.replace('color-', '');
        }

        ctx.fillStyle = color;
        ctx.fillRect(col * downloadDotSize, row * downloadDotSize, downloadDotSize, downloadDotSize);
    });

    const link = document.createElement('a');
    link.download = `dot_pattern_${gridSize}x${gridSize}_${new Date().toISOString().slice(0, 10)}.png`;
    link.style.display = 'none';

    canvas.toBlob(function (blob) {
        if (blob) {
            link.href = URL.createObjectURL(blob);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        } else {
            console.error('画像の生成に失敗しました。');
        }
    }, 'image/png');
}


// ------------------------------------------
// リセット機能
// ------------------------------------------

function resetApplication() {
    paletteSection.classList.add('hidden');
    outputArea.classList.add('hidden');
    setupSection.classList.remove('hidden');
    gridContainer.innerHTML = ''; 
    dotOutput.innerHTML = ''; 
    selectedColor = 'black';
    isDrawing = false; 

    history.length = 0; 
    updateUndoButtonState();

    colorButtons.forEach(btn => btn.classList.remove('selected'));
    document.querySelector('.color-button.color-black').classList.add('selected');
}

// ------------------------------------------
// イベントリスナー
// ------------------------------------------

generateBtn.addEventListener('click', createGrid);
outputBtn.addEventListener('click', outputDotPattern);
resetBtn.addEventListener('click', resetApplication);
undoBtn.addEventListener('click', undo); 

// グリッド外での描画終了を安定させるため、document全体でマウスアップを監視
document.addEventListener('mouseup', stopDrawing);
document.addEventListener('touchend', stopDrawing);
document.addEventListener('touchcancel', stopDrawing);


// ★追加: Ctrl+Z (または Cmd+Z) のショートカットに対応
document.addEventListener('keydown', (event) => {
    // Ctrlキー (Windows/Linux) または Metaキー (MacのCmdキー) が押されているか確認
    const isControlOrCommand = event.ctrlKey || event.metaKey;

    // キーが 'z' または 'Z' で、かつ Ctrl/Cmd キーが押されている場合
    if (isControlOrCommand && event.key.toLowerCase() === 'z') {
        // デフォルトのブラウザ操作（ページ履歴のUndoなど）を防止
        event.preventDefault(); 
        
        // Undoを実行
        undo();
    }
});