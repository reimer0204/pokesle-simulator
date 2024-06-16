import Berry from "./berry";

/**
 * https://docs.google.com/spreadsheets/d/1288GYT929NSGHu-6Yy81A6edmz95iNFo2Kfj5qXC7og/edit#gid=0
 * のV列をコピーして貼り付け
 */

let list = [
  { name: 'フシギダネ', specialty: '食材', berry: 'ドリ', foodList: [{ name: 'あまいミツ', numList: [2, 5, 7] }, { name: 'あんみんトマト', numList: [null, 4, 7] }, { name: 'ほっこりポテト', numList: [null, null, 6] }], skill: '食材ゲットS', help: 4400, bag: 11, foodRate: 0.257, skillRate: 0.019, before: null },
  { name: 'フシギソウ', specialty: '食材', berry: 'ドリ', foodList: [{ name: 'あまいミツ', numList: [2, 5, 7] }, { name: 'あんみんトマト', numList: [null, 4, 7] }, { name: 'ほっこりポテト', numList: [null, null, 6] }], skill: '食材ゲットS', help: 3300, bag: 14, foodRate: 0.255, skillRate: 0.019, before: 'フシギダネ' },
  { name: 'フシギバナ', specialty: '食材', berry: 'ドリ', foodList: [{ name: 'あまいミツ', numList: [2, 5, 7] }, { name: 'あんみんトマト', numList: [null, 4, 7] }, { name: 'ほっこりポテト', numList: [null, null, 6] }], skill: '食材ゲットS', help: 2800, bag: 17, foodRate: 0.266, skillRate: 0.021, before: 'フシギソウ' },
  { name: 'ヒトカゲ', specialty: '食材', berry: 'ヒメリ', foodList: [{ name: 'マメミート', numList: [2, 5, 7] }, { name: 'あったかジンジャー', numList: [null, 4, 7] }, { name: 'げきからハーブ', numList: [null, null, 6] }], skill: '食材ゲットS', help: 3500, bag: 12, foodRate: 0.201, skillRate: 0.011, before: null },
  { name: 'リザード', specialty: '食材', berry: 'ヒメリ', foodList: [{ name: 'マメミート', numList: [2, 5, 7] }, { name: 'あったかジンジャー', numList: [null, 4, 7] }, { name: 'げきからハーブ', numList: [null, null, 6] }], skill: '食材ゲットS', help: 3000, bag: 15, foodRate: 0.227, skillRate: 0.016, before: 'ヒトカゲ' },
  { name: 'リザードン', specialty: '食材', berry: 'ヒメリ', foodList: [{ name: 'マメミート', numList: [2, 5, 7] }, { name: 'あったかジンジャー', numList: [null, 4, 7] }, { name: 'げきからハーブ', numList: [null, null, 6] }], skill: '食材ゲットS', help: 2400, bag: 19, foodRate: 0.224, skillRate: 0.016, before: 'リザード' },
  { name: 'ゼニガメ', specialty: '食材', berry: 'オレン', foodList: [{ name: 'モーモーミルク', numList: [2, 5, 7] }, { name: 'リラックスカカオ', numList: [null, 3, 5] }, { name: 'マメミート', numList: [null, null, 7] }], skill: '食材ゲットS', help: 4500, bag: 10, foodRate: 0.271, skillRate: 0.02, before: null },
  { name: 'カメール', specialty: '食材', berry: 'オレン', foodList: [{ name: 'モーモーミルク', numList: [2, 5, 7] }, { name: 'リラックスカカオ', numList: [null, 3, 5] }, { name: 'マメミート', numList: [null, null, 7] }], skill: '食材ゲットS', help: 3400, bag: 14, foodRate: 0.271, skillRate: 0.02, before: 'ゼニガメ' },
  { name: 'カメックス', specialty: '食材', berry: 'オレン', foodList: [{ name: 'モーモーミルク', numList: [2, 5, 7] }, { name: 'リラックスカカオ', numList: [null, 3, 5] }, { name: 'マメミート', numList: [null, null, 7] }], skill: '食材ゲットS', help: 2800, bag: 17, foodRate: 0.275, skillRate: 0.021, before: 'カメール' },
  { name: 'キャタピー', specialty: 'きのみ', berry: 'ラム', foodList: [{ name: 'あまいミツ', numList: [1, 2, 4] }, { name: 'あんみんトマト', numList: [null, 2, 3] }, { name: 'ワカクサ大豆', numList: [null, null, 4] }], skill: '食材ゲットS', help: 4400, bag: 11, foodRate: 0.179, skillRate: 0.008, before: null },
  { name: 'トランセル', specialty: 'きのみ', berry: 'ラム', foodList: [{ name: 'あまいミツ', numList: [1, 2, 4] }, { name: 'あんみんトマト', numList: [null, 2, 3] }, { name: 'ワカクサ大豆', numList: [null, null, 4] }], skill: '食材ゲットS', help: 4200, bag: 13, foodRate: 0.208, skillRate: 0.018, before: 'キャタピー' },
  { name: 'バタフリー', specialty: 'きのみ', berry: 'ラム', foodList: [{ name: 'あまいミツ', numList: [1, 2, 4] }, { name: 'あんみんトマト', numList: [null, 2, 3] }, { name: 'ワカクサ大豆', numList: [null, null, 4] }], skill: '食材ゲットS', help: 2600, bag: 21, foodRate: 0.197, skillRate: 0.014, before: 'トランセル' },
  { name: 'コラッタ', specialty: 'きのみ', berry: 'キー', foodList: [{ name: 'とくせんリンゴ', numList: [1, 2, 4] }, { name: 'ワカクサ大豆', numList: [null, 2, 3] }, { name: 'マメミート', numList: [null, null, 3] }], skill: 'げんきチャージS', help: 4900, bag: 10, foodRate: 0.237, skillRate: 0.03, before: null },
  { name: 'ラッタ', specialty: 'きのみ', berry: 'キー', foodList: [{ name: 'とくせんリンゴ', numList: [1, 2, 4] }, { name: 'ワカクサ大豆', numList: [null, 2, 3] }, { name: 'マメミート', numList: [null, null, 3] }], skill: 'げんきチャージS', help: 3200, bag: 16, foodRate: 0.237, skillRate: 0.03, before: 'コラッタ' },
  { name: 'アーボ', specialty: 'きのみ', berry: 'カゴ', foodList: [{ name: 'マメミート', numList: [1, 2, 4] }, { name: 'とくせんエッグ', numList: [null, 2, 3] }, { name: 'げきからハーブ', numList: [null, null, 3] }], skill: 'げんきチャージS', help: 5000, bag: 10, foodRate: 0.235, skillRate: 0.033, before: null },
  { name: 'アーボック', specialty: 'きのみ', berry: 'カゴ', foodList: [{ name: 'マメミート', numList: [1, 2, 4] }, { name: 'とくせんエッグ', numList: [null, 2, 3] }, { name: 'げきからハーブ', numList: [null, null, 3] }], skill: 'げんきチャージS', help: 3700, bag: 14, foodRate: 0.264, skillRate: 0.057, before: 'アーボ' },
  { name: 'ピカチュウ', specialty: 'きのみ', berry: 'ウブ', foodList: [{ name: 'とくせんリンゴ', numList: [1, 2, 4] }, { name: 'あったかジンジャー', numList: [null, 2, 3] }, { name: 'とくせんエッグ', numList: [null, null, 3] }], skill: 'エナジーチャージS', help: 2700, bag: 17, foodRate: 0.207, skillRate: 0.021, before: 'ピチュー' },
  { name: 'ピカチュウ(ハロウィン)', specialty: 'きのみ', berry: 'ウブ', foodList: [{ name: 'とくせんリンゴ', numList: [1, 2, 4] }, { name: 'あったかジンジャー', numList: [null, 2, 3] }, { name: 'とくせんエッグ', numList: [null, null, 3] }], skill: 'エナジーチャージS(ランダム)', help: 2600, bag: 18, foodRate: 0.218, skillRate: 0.028, before: null },
  { name: 'ピカチュウ(ホリデー)', specialty: 'スキル', berry: 'ウブ', foodList: [{ name: 'とくせんリンゴ', numList: [1, 2, 4] }, { name: 'あったかジンジャー', numList: [null, 2, 3] }, { name: 'とくせんエッグ', numList: [null, null, 3] }], skill: 'ゆめのかけらゲットS', help: 2600, bag: 18, foodRate: 0.131, skillRate: 0.042, before: null },
  { name: 'ライチュウ', specialty: 'きのみ', berry: 'ウブ', foodList: [{ name: 'とくせんリンゴ', numList: [1, 2, 4] }, { name: 'あったかジンジャー', numList: [null, 2, 3] }, { name: 'とくせんエッグ', numList: [null, null, 3] }], skill: 'エナジーチャージS', help: 2200, bag: 21, foodRate: 0.224, skillRate: 0.032, before: 'ピカチュウ' },
  { name: 'ピッピ', specialty: 'きのみ', berry: 'モモン', foodList: [{ name: 'とくせんリンゴ', numList: [1, 2, 4] }, { name: 'あまいミツ', numList: [null, 2, 3] }, { name: 'ワカクサ大豆', numList: [null, null, 3] }], skill: 'ゆびをふる', help: 4000, bag: 16, foodRate: 0.168, skillRate: 0.036, before: 'ピィ' },
  { name: 'ピクシー', specialty: 'きのみ', berry: 'モモン', foodList: [{ name: 'とくせんリンゴ', numList: [1, 2, 4] }, { name: 'あまいミツ', numList: [null, 2, 3] }, { name: 'ワカクサ大豆', numList: [null, null, 3] }], skill: 'ゆびをふる', help: 2800, bag: 20, foodRate: 0.168, skillRate: 0.036, before: 'ピッピ' },
  { name: 'ロコン', specialty: 'きのみ', berry: 'ヒメリ', foodList: [{ name: 'ワカクサ大豆', numList: [1, 2, 4] }, { name: 'ワカクサコーン', numList: [null, 2, 3] }, { name: 'ほっこりポテト', numList: [null, null, 3] }], skill: 'げんきエールS', help: 4700, bag: 13, foodRate: 0.168, skillRate: 0.027, before: null },
  { name: 'キュウコン', specialty: 'きのみ', berry: 'ヒメリ', foodList: [{ name: 'ワカクサ大豆', numList: [1, 2, 4] }, { name: 'ワカクサコーン', numList: [null, 2, 3] }, { name: 'ほっこりポテト', numList: [null, null, 3] }], skill: 'げんきエールS', help: 2600, bag: 23, foodRate: 0.164, skillRate: 0.025, before: 'ロコン' },
  { name: 'プリン', specialty: 'スキル', berry: 'モモン', foodList: [{ name: 'あまいミツ', numList: [1, 2, 4] }, { name: 'ピュアなオイル', numList: [null, 2, 3] }, { name: 'リラックスカカオ', numList: [null, null, 2] }], skill: 'げんきオールS', help: 3900, bag: 9, foodRate: 0.182, skillRate: 0.043, before: 'ププリン' },
  { name: 'プクリン', specialty: 'スキル', berry: 'モモン', foodList: [{ name: 'あまいミツ', numList: [1, 2, 4] }, { name: 'ピュアなオイル', numList: [null, 2, 3] }, { name: 'リラックスカカオ', numList: [null, null, 2] }], skill: 'げんきオールS', help: 2900, bag: 13, foodRate: 0.174, skillRate: 0.04, before: 'プリン' },
  { name: 'ディグダ', specialty: '食材', berry: 'フィラ', foodList: [{ name: 'あんみんトマト', numList: [2, 5, 7] }, { name: 'ふといながねぎ', numList: [null, 3, 4] }, { name: 'ワカクサ大豆', numList: [null, null, 8] }], skill: 'エナジーチャージS', help: 4300, bag: 10, foodRate: 0.192, skillRate: 0.021, before: null },
  { name: 'ダグトリオ', specialty: '食材', berry: 'フィラ', foodList: [{ name: 'あんみんトマト', numList: [2, 5, 7] }, { name: 'ふといながねぎ', numList: [null, 3, 4] }, { name: 'ワカクサ大豆', numList: [null, null, 8] }], skill: 'エナジーチャージS', help: 2800, bag: 16, foodRate: 0.19, skillRate: 0.02, before: 'ディグダ' },
  { name: 'ニャース', specialty: 'スキル', berry: 'キー', foodList: [{ name: 'モーモーミルク', numList: [1, 2, 4] }, { name: 'マメミート', numList: [null, 2, 3] }, null], skill: 'ゆめのかけらゲットS', help: 4400, bag: 9, foodRate: 0.163, skillRate: 0.042, before: null },
  { name: 'ペルシアン', specialty: 'スキル', berry: 'キー', foodList: [{ name: 'モーモーミルク', numList: [1, 2, 4] }, { name: 'マメミート', numList: [null, 2, 3] }, null], skill: 'ゆめのかけらゲットS', help: 2800, bag: 12, foodRate: 0.169, skillRate: 0.044, before: 'ニャース' },
  { name: 'コダック', specialty: 'スキル', berry: 'オレン', foodList: [{ name: 'リラックスカカオ', numList: [1, 2, 4] }, { name: 'とくせんリンゴ', numList: [null, 4, 6] }, { name: 'マメミート', numList: [null, null, 5] }], skill: 'エナジーチャージS(ランダム)', help: 5400, bag: 8, foodRate: 0.136, skillRate: 0.126, before: null },
  { name: 'ゴルダック', specialty: 'スキル', berry: 'オレン', foodList: [{ name: 'リラックスカカオ', numList: [1, 2, 4] }, { name: 'とくせんリンゴ', numList: [null, 4, 6] }, { name: 'マメミート', numList: [null, null, 5] }], skill: 'エナジーチャージS(ランダム)', help: 3400, bag: 14, foodRate: 0.162, skillRate: 0.125, before: 'コダック' },
  { name: 'マンキー', specialty: 'きのみ', berry: 'クラボ', foodList: [{ name: 'マメミート', numList: [1, 2, 4] }, { name: 'あじわいキノコ', numList: [null, 1, 2] }, { name: 'あまいミツ', numList: [null, null, 4] }], skill: 'エナジーチャージS(ランダム)', help: 4200, bag: 12, foodRate: 0.197, skillRate: 0.022, before: null },
  { name: 'オコリザル', specialty: 'きのみ', berry: 'クラボ', foodList: [{ name: 'マメミート', numList: [1, 2, 4] }, { name: 'あじわいキノコ', numList: [null, 1, 2] }, { name: 'あまいミツ', numList: [null, null, 4] }], skill: 'エナジーチャージS(ランダム)', help: 2800, bag: 17, foodRate: 0.2, skillRate: 0.024, before: 'マンキー' },
  { name: 'ガーディ', specialty: 'スキル', berry: 'ヒメリ', foodList: [{ name: 'げきからハーブ', numList: [1, 2, 4] }, { name: 'マメミート', numList: [null, 3, 5] }, { name: 'モーモーミルク', numList: [null, null, 5] }], skill: 'おてつだいサポートS', help: 4300, bag: 8, foodRate: 0.138, skillRate: 0.05, before: null },
  { name: 'ウインディ', specialty: 'スキル', berry: 'ヒメリ', foodList: [{ name: 'げきからハーブ', numList: [1, 2, 4] }, { name: 'マメミート', numList: [null, 3, 5] }, { name: 'モーモーミルク', numList: [null, null, 5] }], skill: 'おてつだいサポートS', help: 2500, bag: 16, foodRate: 0.136, skillRate: 0.049, before: 'ガーディ' },
  { name: 'マダツボミ', specialty: '食材', berry: 'ドリ', foodList: [{ name: 'あんみんトマト', numList: [2, 5, 7] }, { name: 'ほっこりポテト', numList: [null, 4, 6] }, { name: 'ふといながねぎ', numList: [null, null, 4] }], skill: 'げんきチャージS', help: 5200, bag: 8, foodRate: 0.233, skillRate: 0.039, before: null },
  { name: 'ウツドン', specialty: '食材', berry: 'ドリ', foodList: [{ name: 'あんみんトマト', numList: [2, 5, 7] }, { name: 'ほっこりポテト', numList: [null, 4, 6] }, { name: 'ふといながねぎ', numList: [null, null, 4] }], skill: 'げんきチャージS', help: 3800, bag: 12, foodRate: 0.235, skillRate: 0.04, before: 'マダツボミ' },
  { name: 'ウツボット', specialty: '食材', berry: 'ドリ', foodList: [{ name: 'あんみんトマト', numList: [2, 5, 7] }, { name: 'ほっこりポテト', numList: [null, 4, 6] }, { name: 'ふといながねぎ', numList: [null, null, 4] }], skill: 'げんきチャージS', help: 2800, bag: 17, foodRate: 0.233, skillRate: 0.039, before: 'ウツドン' },
  { name: 'イシツブテ', specialty: '食材', berry: 'オボン', foodList: [{ name: 'ワカクサ大豆', numList: [2, 5, 7] }, { name: 'ほっこりポテト', numList: [null, 4, 6] }, { name: 'あじわいキノコ', numList: [null, null, 4] }], skill: 'エナジーチャージS(ランダム)', help: 5700, bag: 9, foodRate: 0.281, skillRate: 0.052, before: null },
  { name: 'ゴローン', specialty: '食材', berry: 'オボン', foodList: [{ name: 'ワカクサ大豆', numList: [2, 5, 7] }, { name: 'ほっこりポテト', numList: [null, 4, 6] }, { name: 'あじわいキノコ', numList: [null, null, 4] }], skill: 'エナジーチャージS(ランダム)', help: 4000, bag: 12, foodRate: 0.272, skillRate: 0.048, before: 'イシツブテ' },
  { name: 'ゴローニャ', specialty: '食材', berry: 'オボン', foodList: [{ name: 'ワカクサ大豆', numList: [2, 5, 7] }, { name: 'ほっこりポテト', numList: [null, 4, 6] }, { name: 'あじわいキノコ', numList: [null, null, 4] }], skill: 'エナジーチャージS(ランダム)', help: 3100, bag: 16, foodRate: 0.28, skillRate: 0.052, before: 'ゴローン' },
  { name: 'ヤドン', specialty: 'スキル', berry: 'オレン', foodList: [{ name: 'リラックスカカオ', numList: [1, 2, 4] }, { name: 'おいしいシッポ', numList: [null, 1, 2] }, { name: 'あんみんトマト', numList: [null, null, 5] }], skill: 'げんきエールS', help: 5700, bag: 9, foodRate: 0.151, skillRate: 0.067, before: null },
  { name: 'ヤドラン', specialty: 'スキル', berry: 'オレン', foodList: [{ name: 'リラックスカカオ', numList: [1, 2, 4] }, { name: 'おいしいシッポ', numList: [null, 1, 2] }, { name: 'あんみんトマト', numList: [null, null, 5] }], skill: 'げんきエールS', help: 3800, bag: 10, foodRate: 0.197, skillRate: 0.068, before: 'ヤドン' },
  { name: 'コイル', specialty: 'スキル', berry: 'ベリブ', foodList: [{ name: 'ピュアなオイル', numList: [1, 2, 4] }, { name: 'げきからハーブ', numList: [null, 2, 3] }, null], skill: '料理パワーアップS', help: 5800, bag: 8, foodRate: 0.182, skillRate: 0.064, before: null },
  { name: 'レアコイル', specialty: 'スキル', berry: 'ベリブ', foodList: [{ name: 'ピュアなオイル', numList: [1, 2, 4] }, { name: 'げきからハーブ', numList: [null, 2, 3] }, null], skill: '料理パワーアップS', help: 4000, bag: 11, foodRate: 0.182, skillRate: 0.063, before: 'コイル' },
  { name: 'ドードー', specialty: 'きのみ', berry: 'シーヤ', foodList: [{ name: 'ワカクサ大豆', numList: [1, 2, 4] }, { name: 'リラックスカカオ', numList: [null, 1, 2] }, { name: 'マメミート', numList: [null, null, 3] }], skill: 'げんきチャージS', help: 3800, bag: 13, foodRate: 0.184, skillRate: 0.02, before: null },
  { name: 'ドードリオ', specialty: 'きのみ', berry: 'シーヤ', foodList: [{ name: 'ワカクサ大豆', numList: [1, 2, 4] }, { name: 'リラックスカカオ', numList: [null, 1, 2] }, { name: 'マメミート', numList: [null, null, 3] }], skill: 'げんきチャージS', help: 2400, bag: 21, foodRate: 0.184, skillRate: 0.02, before: 'ドードー' },
  { name: 'ゴース', specialty: '食材', berry: 'ブリー', foodList: [{ name: 'げきからハーブ', numList: [2, 5, 7] }, { name: 'あじわいキノコ', numList: [null, 4, 6] }, { name: 'ピュアなオイル', numList: [null, null, 8] }], skill: 'エナジーチャージS(ランダム)', help: 3800, bag: 10, foodRate: 0.144, skillRate: 0.015, before: null },
  { name: 'ゴースト', specialty: '食材', berry: 'ブリー', foodList: [{ name: 'げきからハーブ', numList: [2, 5, 7] }, { name: 'あじわいキノコ', numList: [null, 4, 6] }, { name: 'ピュアなオイル', numList: [null, null, 8] }], skill: 'エナジーチャージS(ランダム)', help: 3000, bag: 14, foodRate: 0.157, skillRate: 0.022, before: 'ゴース' },
  { name: 'ゲンガー', specialty: '食材', berry: 'ブリー', foodList: [{ name: 'げきからハーブ', numList: [2, 5, 7] }, { name: 'あじわいキノコ', numList: [null, 4, 6] }, { name: 'ピュアなオイル', numList: [null, null, 8] }], skill: 'エナジーチャージS(ランダム)', help: 2200, bag: 18, foodRate: 0.161, skillRate: 0.024, before: 'ゴースト' },
  { name: 'イワーク', specialty: 'きのみ', berry: 'オボン', foodList: [{ name: 'あんみんトマト', numList: [1, 2, 4] }, { name: 'マメミート', numList: [null, 2, 4] }, { name: 'ほっこりポテト', numList: [null, null, 3] }], skill: '食材ゲットS', help: 3100, bag: 22, foodRate: 0.132, skillRate: 0.023, before: null },
  { name: 'カラカラ', specialty: 'きのみ', berry: 'フィラ', foodList: [{ name: 'あったかジンジャー', numList: [1, 2, 4] }, { name: 'リラックスカカオ', numList: [null, 2, 3] }, null], skill: 'げんきチャージS', help: 4800, bag: 10, foodRate: 0.223, skillRate: 0.044, before: null },
  { name: 'ガラガラ', specialty: 'きのみ', berry: 'フィラ', foodList: [{ name: 'あったかジンジャー', numList: [1, 2, 4] }, { name: 'リラックスカカオ', numList: [null, 2, 3] }, null], skill: 'げんきチャージS', help: 3500, bag: 15, foodRate: 0.225, skillRate: 0.045, before: 'カラカラ' },
  { name: 'ガルーラ', specialty: '食材', berry: 'キー', foodList: [{ name: 'あったかジンジャー', numList: [2, 5, 7] }, { name: 'ほっこりポテト', numList: [null, 4, 6] }, { name: 'ワカクサ大豆', numList: [null, null, 8] }], skill: '食材ゲットS', help: 2800, bag: 16, foodRate: 0.222, skillRate: 0.017, before: null },
  { name: 'バリヤード', specialty: '食材', berry: 'マゴ', foodList: [{ name: 'あんみんトマト', numList: [2, 5, 7] }, { name: 'ほっこりポテト', numList: [null, 4, 6] }, { name: 'ふといながねぎ', numList: [null, null, 4] }], skill: 'エナジーチャージS', help: 2800, bag: 17, foodRate: 0.216, skillRate: 0.039, before: 'マネネ' },
  { name: 'カイロス', specialty: '食材', berry: 'ラム', foodList: [{ name: 'あまいミツ', numList: [2, 5, 7] }, { name: 'とくせんリンゴ', numList: [null, 5, 8] }, { name: 'マメミート', numList: [null, null, 7] }], skill: 'エナジーチャージS', help: 2400, bag: 19, foodRate: 0.216, skillRate: 0.031, before: null },
  { name: 'メタモン', specialty: '食材', berry: 'キー', foodList: [{ name: 'ピュアなオイル', numList: [2, 5, 7] }, { name: 'ふといながねぎ', numList: [null, 3, 5] }, { name: 'おいしいシッポ', numList: [null, null, 3] }], skill: 'エナジーチャージS(ランダム)', help: 3500, bag: 13, foodRate: 0.201, skillRate: 0.036, before: null },
  { name: 'イーブイ', specialty: 'スキル', berry: 'キー', foodList: [{ name: 'モーモーミルク', numList: [1, 2, 4] }, { name: 'リラックスカカオ', numList: [null, 1, 2] }, { name: 'マメミート', numList: [null, null, 3] }], skill: '食材ゲットS', help: 3700, bag: 12, foodRate: 0.192, skillRate: 0.055, before: null },
  { name: 'シャワーズ', specialty: 'スキル', berry: 'オレン', foodList: [{ name: 'モーモーミルク', numList: [1, 2, 4] }, { name: 'リラックスカカオ', numList: [null, 1, 2] }, { name: 'マメミート', numList: [null, null, 3] }], skill: '食材ゲットS', help: 3100, bag: 13, foodRate: 0.212, skillRate: 0.061, before: 'イーブイ' },
  { name: 'サンダース', specialty: 'スキル', berry: 'ウブ', foodList: [{ name: 'モーモーミルク', numList: [1, 2, 4] }, { name: 'リラックスカカオ', numList: [null, 1, 2] }, { name: 'マメミート', numList: [null, null, 3] }], skill: 'おてつだいサポートS', help: 2200, bag: 17, foodRate: 0.151, skillRate: 0.039, before: 'イーブイ' },
  { name: 'ブースター', specialty: 'スキル', berry: 'ヒメリ', foodList: [{ name: 'モーモーミルク', numList: [1, 2, 4] }, { name: 'リラックスカカオ', numList: [null, 1, 2] }, { name: 'マメミート', numList: [null, null, 3] }], skill: '料理パワーアップS', help: 2700, bag: 14, foodRate: 0.185, skillRate: 0.052, before: 'イーブイ' },
  { name: 'ミニリュウ', specialty: '食材', berry: 'ヤチェ', foodList: [{ name: 'げきからハーブ', numList: [2, 5, 7] }, { name: 'ワカクサコーン', numList: [null, 4, 7] }, { name: 'ピュアなオイル', numList: [null, null, 8] }], skill: 'げんきチャージS', help: 5000, bag: 9, foodRate: 0.25, skillRate: 0.02, before: null },
  { name: 'ハクリュー', specialty: '食材', berry: 'ヤチェ', foodList: [{ name: 'げきからハーブ', numList: [2, 5, 7] }, { name: 'ワカクサコーン', numList: [null, 4, 7] }, { name: 'ピュアなオイル', numList: [null, null, 8] }], skill: 'げんきチャージS', help: 3800, bag: 12, foodRate: 0.262, skillRate: 0.025, before: 'ミニリュウ' },
  { name: 'カイリュー', specialty: '食材', berry: 'ヤチェ', foodList: [{ name: 'げきからハーブ', numList: [2, 5, 7] }, { name: 'ワカクサコーン', numList: [null, 4, 7] }, { name: 'ピュアなオイル', numList: [null, null, 8] }], skill: 'げんきチャージS', help: 2600, bag: 20, foodRate: 0.264, skillRate: 0.026, before: 'ハクリュー' },
  { name: 'チコリータ', specialty: 'きのみ', berry: 'ドリ', foodList: [{ name: 'リラックスカカオ', numList: [1, 2, 4] }, { name: 'あまいミツ', numList: [null, 3, 5] }, { name: 'ふといながねぎ', numList: [null, null, 3] }], skill: 'エナジーチャージS(ランダム)', help: 4400, bag: 12, foodRate: 0.169, skillRate: 0.039, before: null },
  { name: 'ベイリーフ', specialty: 'きのみ', berry: 'ドリ', foodList: [{ name: 'リラックスカカオ', numList: [1, 2, 4] }, { name: 'あまいミツ', numList: [null, 3, 5] }, { name: 'ふといながねぎ', numList: [null, null, 3] }], skill: 'エナジーチャージS(ランダム)', help: 3300, bag: 17, foodRate: 0.168, skillRate: 0.038, before: 'チコリータ' },
  { name: 'メガニウム', specialty: 'きのみ', berry: 'ドリ', foodList: [{ name: 'リラックスカカオ', numList: [1, 2, 4] }, { name: 'あまいミツ', numList: [null, 3, 5] }, { name: 'ふといながねぎ', numList: [null, null, 3] }], skill: 'エナジーチャージS(ランダム)', help: 2800, bag: 20, foodRate: 0.175, skillRate: 0.046, before: 'ベイリーフ' },
  { name: 'ヒノアラシ', specialty: 'きのみ', berry: 'ヒメリ', foodList: [{ name: 'あったかジンジャー', numList: [1, 2, 4] }, { name: 'げきからハーブ', numList: [null, 2, 3] }, { name: 'ピュアなオイル', numList: [null, null, 3] }], skill: 'エナジーチャージS(ランダム)', help: 3500, bag: 14, foodRate: 0.186, skillRate: 0.021, before: null },
  { name: 'マグマラシ', specialty: 'きのみ', berry: 'ヒメリ', foodList: [{ name: 'あったかジンジャー', numList: [1, 2, 4] }, { name: 'げきからハーブ', numList: [null, 2, 3] }, { name: 'ピュアなオイル', numList: [null, null, 3] }], skill: 'エナジーチャージS(ランダム)', help: 3000, bag: 18, foodRate: 0.211, skillRate: 0.041, before: 'ヒノアラシ' },
  { name: 'バクフーン', specialty: 'きのみ', berry: 'ヒメリ', foodList: [{ name: 'あったかジンジャー', numList: [1, 2, 4] }, { name: 'げきからハーブ', numList: [null, 2, 3] }, { name: 'ピュアなオイル', numList: [null, null, 3] }], skill: 'エナジーチャージS(ランダム)', help: 2400, bag: 23, foodRate: 0.208, skillRate: 0.039, before: 'マグマラシ' },
  { name: 'ワニノコ', specialty: 'きのみ', berry: 'オレン', foodList: [{ name: 'マメミート', numList: [1, 2, 4] }, { name: 'ピュアなオイル', numList: [null, 2, 3] }, null], skill: 'エナジーチャージS(ランダム)', help: 4500, bag: 11, foodRate: 0.253, skillRate: 0.052, before: null },
  { name: 'アリゲイツ', specialty: 'きのみ', berry: 'オレン', foodList: [{ name: 'マメミート', numList: [1, 2, 4] }, { name: 'ピュアなオイル', numList: [null, 2, 3] }, null], skill: 'エナジーチャージS(ランダム)', help: 3400, bag: 15, foodRate: 0.253, skillRate: 0.052, before: 'ワニノコ' },
  { name: 'オーダイル', specialty: 'きのみ', berry: 'オレン', foodList: [{ name: 'マメミート', numList: [1, 2, 4] }, { name: 'ピュアなオイル', numList: [null, 2, 3] }, null], skill: 'エナジーチャージS(ランダム)', help: 2800, bag: 19, foodRate: 0.257, skillRate: 0.055, before: 'アリゲイツ' },
  { name: 'ピチュー', specialty: 'きのみ', berry: 'ウブ', foodList: [{ name: 'とくせんリンゴ', numList: [1, 2, 4] }, { name: 'あったかジンジャー', numList: [null, 2, 3] }, { name: 'とくせんエッグ', numList: [null, null, 3] }], skill: 'エナジーチャージS', help: 4300, bag: 10, foodRate: 0.21, skillRate: 0.023, before: null },
  { name: 'ピィ', specialty: 'きのみ', berry: 'モモン', foodList: [{ name: 'とくせんリンゴ', numList: [1, 2, 4] }, { name: 'あまいミツ', numList: [null, 2, 3] }, { name: 'ワカクサ大豆', numList: [null, null, 3] }], skill: 'ゆびをふる', help: 5600, bag: 10, foodRate: 0.164, skillRate: 0.034, before: null },
  { name: 'ププリン', specialty: 'スキル', berry: 'モモン', foodList: [{ name: 'あまいミツ', numList: [1, 2, 4] }, { name: 'ピュアなオイル', numList: [null, 2, 3] }, { name: 'リラックスカカオ', numList: [null, null, 2] }], skill: 'げんきオールS', help: 5200, bag: 8, foodRate: 0.17, skillRate: 0.038, before: null },
  { name: 'トゲピー', specialty: 'スキル', berry: 'モモン', foodList: [{ name: 'とくせんエッグ', numList: [1, 2, 4] }, { name: 'あったかジンジャー', numList: [null, 2, 4] }, { name: 'リラックスカカオ', numList: [null, null, 3] }], skill: 'ゆびをふる', help: 4800, bag: 8, foodRate: 0.151, skillRate: 0.049, before: null },
  { name: 'トゲチック', specialty: 'スキル', berry: 'モモン', foodList: [{ name: 'とくせんエッグ', numList: [1, 2, 4] }, { name: 'あったかジンジャー', numList: [null, 2, 4] }, { name: 'リラックスカカオ', numList: [null, null, 3] }], skill: 'ゆびをふる', help: 3800, bag: 10, foodRate: 0.163, skillRate: 0.056, before: 'トゲピー' },
  { name: 'メリープ', specialty: 'スキル', berry: 'ウブ', foodList: [{ name: 'げきからハーブ', numList: [1, 2, 4] }, { name: 'とくせんエッグ', numList: [null, 3, 4] }, null], skill: 'エナジーチャージM', help: 4600, bag: 9, foodRate: 0.128, skillRate: 0.047, before: null },
  { name: 'モココ', specialty: 'スキル', berry: 'ウブ', foodList: [{ name: 'げきからハーブ', numList: [1, 2, 4] }, { name: 'とくせんエッグ', numList: [null, 3, 4] }, null], skill: 'エナジーチャージM', help: 3300, bag: 11, foodRate: 0.127, skillRate: 0.046, before: 'メリープ' },
  { name: 'デンリュウ', specialty: 'スキル', berry: 'ウブ', foodList: [{ name: 'げきからハーブ', numList: [1, 2, 4] }, { name: 'とくせんエッグ', numList: [null, 3, 4] }, null], skill: 'エナジーチャージM', help: 2500, bag: 15, foodRate: 0.13, skillRate: 0.047, before: 'モココ' },
  { name: 'ウソッキー', specialty: 'スキル', berry: 'オボン', foodList: [{ name: 'あんみんトマト', numList: [1, 2, 4] }, { name: 'ワカクサ大豆', numList: [null, 2, 4] }, { name: 'あじわいキノコ', numList: [null, null, 2] }], skill: 'エナジーチャージM', help: 4000, bag: 10, foodRate: 0.217, skillRate: 0.072, before: 'ウソハチ' },
  { name: 'エーフィ', specialty: 'スキル', berry: 'マゴ', foodList: [{ name: 'モーモーミルク', numList: [1, 2, 4] }, { name: 'リラックスカカオ', numList: [null, 1, 2] }, { name: 'マメミート', numList: [null, null, 3] }], skill: 'エナジーチャージM', help: 2400, bag: 16, foodRate: 0.164, skillRate: 0.044, before: 'イーブイ' },
  { name: 'ブラッキー', specialty: 'スキル', berry: 'ウイ', foodList: [{ name: 'モーモーミルク', numList: [1, 2, 4] }, { name: 'リラックスカカオ', numList: [null, 1, 2] }, { name: 'マメミート', numList: [null, null, 3] }], skill: 'げんきチャージS', help: 3200, bag: 14, foodRate: 0.219, skillRate: 0.141, before: 'イーブイ' },
  { name: 'ヤドキング', specialty: 'スキル', berry: 'オレン', foodList: [{ name: 'リラックスカカオ', numList: [1, 2, 4] }, { name: 'おいしいシッポ', numList: [null, 1, 2] }, { name: 'あんみんトマト', numList: [null, null, 5] }], skill: 'げんきエールS', help: 3400, bag: 11, foodRate: 0.166, skillRate: 0.074, before: 'ヤドン' },
  { name: 'ソーナンス', specialty: 'スキル', berry: 'マゴ', foodList: [{ name: 'とくせんリンゴ', numList: [1, 2, 4] }, { name: 'あじわいキノコ', numList: [null, 1, 2] }, { name: 'ピュアなオイル', numList: [null, null, 3] }], skill: 'げんきエールS', help: 3500, bag: 13, foodRate: 0.211, skillRate: 0.064, before: 'ソーナノ' },
  { name: 'ハガネール', specialty: 'きのみ', berry: 'ベリブ', foodList: [{ name: 'あんみんトマト', numList: [1, 2, 4] }, { name: 'マメミート', numList: [null, 2, 4] }, { name: 'ほっこりポテト', numList: [null, null, 3] }], skill: '食材ゲットS', help: 3000, bag: 15, foodRate: 0.154, skillRate: 0.032, before: 'イワーク' },
  { name: 'ヘラクロス', specialty: 'スキル', berry: 'ラム', foodList: [{ name: 'あまいミツ', numList: [1, 2, 4] }, { name: 'あじわいキノコ', numList: [null, 1, 2] }, { name: 'マメミート', numList: [null, null, 4] }], skill: '食材ゲットS', help: 2500, bag: 15, foodRate: 0.158, skillRate: 0.047, before: null },
  { name: 'デリバード', specialty: '食材', berry: 'シーヤ', foodList: [{ name: 'とくせんエッグ', numList: [2, 5, 7] }, { name: 'とくせんリンゴ', numList: [null, 6, 9] }, { name: 'リラックスカカオ', numList: [null, null, 5] }], skill: '食材ゲットS', help: 2500, bag: 20, foodRate: 0.188, skillRate: 0.015, before: null },
  { name: 'デルビル', specialty: 'きのみ', berry: 'ウイ', foodList: [{ name: 'げきからハーブ', numList: [1, 2, 4] }, { name: 'あったかジンジャー', numList: [null, 3, 4] }, { name: 'ふといながねぎ', numList: [null, null, 3] }], skill: 'エナジーチャージS', help: 4900, bag: 10, foodRate: 0.201, skillRate: 0.044, before: null },
  { name: 'ヘルガー', specialty: 'きのみ', berry: 'ウイ', foodList: [{ name: 'げきからハーブ', numList: [1, 2, 4] }, { name: 'あったかジンジャー', numList: [null, 3, 4] }, { name: 'ふといながねぎ', numList: [null, null, 3] }], skill: 'エナジーチャージS', help: 3300, bag: 16, foodRate: 0.203, skillRate: 0.046, before: 'デルビル' },
  { name: 'ライコウ', specialty: 'スキル', berry: 'ウブ', foodList: [{ name: 'マメミート', numList: [1, 2, 4] }, { name: 'げきからハーブ', numList: [null, 2, 3] }, { name: 'ふといながねぎ', numList: [null, null, 2] }], skill: 'おてつだいブースト', help: 2100, bag: 22, foodRate: 0.192, skillRate: 0.019, before: null },
  { name: 'エンテイ', specialty: 'スキル', berry: 'ヒメリ', foodList: [{ name: 'ピュアなオイル', numList: [1, 2, 4] }, { name: 'あんみんトマト', numList: [null, 2, 4] }, { name: 'あじわいキノコ', numList: [null, null, 3] }], skill: 'おてつだいブースト', help: 2400, bag: 19, foodRate: 0.187, skillRate: 0.023, before: null },
  { name: 'ヨーギラス', specialty: '食材', berry: 'オボン', foodList: [{ name: 'あったかジンジャー', numList: [2, 5, 7] }, { name: 'ワカクサ大豆', numList: [null, 5, 8] }, { name: 'マメミート', numList: [null, null, 8] }], skill: 'げんきチャージS', help: 4800, bag: 9, foodRate: 0.238, skillRate: 0.041, before: null },
  { name: 'サナギラス', specialty: '食材', berry: 'オボン', foodList: [{ name: 'あったかジンジャー', numList: [2, 5, 7] }, { name: 'ワカクサ大豆', numList: [null, 5, 8] }, { name: 'マメミート', numList: [null, null, 8] }], skill: 'げんきチャージS', help: 3600, bag: 13, foodRate: 0.247, skillRate: 0.045, before: 'ヨーギラス' },
  { name: 'バンギラス', specialty: '食材', berry: 'ウイ', foodList: [{ name: 'あったかジンジャー', numList: [2, 5, 7] }, { name: 'ワカクサ大豆', numList: [null, 5, 8] }, { name: 'マメミート', numList: [null, null, 8] }], skill: 'げんきチャージS', help: 2700, bag: 19, foodRate: 0.266, skillRate: 0.052, before: 'サナギラス' },
  { name: 'ラルトス', specialty: 'スキル', berry: 'マゴ', foodList: [{ name: 'とくせんリンゴ', numList: [1, 2, 4] }, { name: 'ワカクサコーン', numList: [null, 1, 2] }, { name: 'ふといながねぎ', numList: [null, null, 2] }], skill: 'げんきオールS', help: 4800, bag: 9, foodRate: 0.145, skillRate: 0.043, before: null },
  { name: 'キルリア', specialty: 'スキル', berry: 'マゴ', foodList: [{ name: 'とくせんリンゴ', numList: [1, 2, 4] }, { name: 'ワカクサコーン', numList: [null, 1, 2] }, { name: 'ふといながねぎ', numList: [null, null, 2] }], skill: 'げんきオールS', help: 3500, bag: 13, foodRate: 0.146, skillRate: 0.043, before: 'ラルトス' },
  { name: 'サーナイト', specialty: 'スキル', berry: 'マゴ', foodList: [{ name: 'とくせんリンゴ', numList: [1, 2, 4] }, { name: 'ワカクサコーン', numList: [null, 1, 2] }, { name: 'ふといながねぎ', numList: [null, null, 2] }], skill: 'げんきオールS', help: 2400, bag: 18, foodRate: 0.144, skillRate: 0.042, before: 'キルリア' },
  { name: 'エルレイド', specialty: 'スキル', berry: 'クラボ', foodList: [{ name: 'とくせんリンゴ', numList: [1, 2, 4] }, { name: 'ワカクサコーン', numList: [null, 1, 2] }, { name: 'ふといながねぎ', numList: [null, null, 2] }], skill: 'おてつだいサポートS', help: 2400, bag: 19, foodRate: 0.147, skillRate: 0.054, before: 'キルリア' },
  { name: 'ナマケロ', specialty: 'きのみ', berry: 'キー', foodList: [{ name: 'あんみんトマト', numList: [1, 2, 4] }, { name: 'あまいミツ', numList: [null, 2, 4] }, { name: 'とくせんリンゴ', numList: [null, null, 4] }], skill: '食材ゲットS', help: 4900, bag: 7, foodRate: 0.216, skillRate: 0.019, before: null },
  { name: 'ヤルキモノ', specialty: 'きのみ', berry: 'キー', foodList: [{ name: 'あんみんトマト', numList: [1, 2, 4] }, { name: 'あまいミツ', numList: [null, 2, 4] }, { name: 'とくせんリンゴ', numList: [null, null, 4] }], skill: '食材ゲットS', help: 3200, bag: 9, foodRate: 0.204, skillRate: 0.015, before: 'ナマケロ' },
  { name: 'ケッキング', specialty: 'きのみ', berry: 'キー', foodList: [{ name: 'あんみんトマト', numList: [1, 2, 4] }, { name: 'あまいミツ', numList: [null, 2, 4] }, { name: 'とくせんリンゴ', numList: [null, null, 4] }], skill: '食材ゲットS', help: 3800, bag: 12, foodRate: 0.339, skillRate: 0.067, before: 'ヤルキモノ' },
  { name: 'ヤミラミ', specialty: 'スキル', berry: 'ウイ', foodList: [{ name: 'ピュアなオイル', numList: [1, 2, 4] }, { name: 'あじわいキノコ', numList: [null, 2, 3] }, { name: 'リラックスカカオ', numList: [null, null, 3] }], skill: 'ゆめのかけらゲットS(ランダム)', help: 3600, bag: 10, foodRate: 0.188, skillRate: 0.068, before: null },
  { name: 'ゴクリン', specialty: 'スキル', berry: 'カゴ', foodList: [{ name: 'ワカクサ大豆', numList: [1, 2, 4] }, { name: 'あじわいキノコ', numList: [null, 1, 2] }, { name: 'あまいミツ', numList: [null, null, 4] }], skill: 'ゆめのかけらゲットS(ランダム)', help: 5900, bag: 8, foodRate: 0.214, skillRate: 0.063, before: null },
  { name: 'マルノーム', specialty: 'スキル', berry: 'カゴ', foodList: [{ name: 'ワカクサ大豆', numList: [1, 2, 4] }, { name: 'あじわいキノコ', numList: [null, 1, 2] }, { name: 'あまいミツ', numList: [null, null, 4] }], skill: 'ゆめのかけらゲットS(ランダム)', help: 3500, bag: 13, foodRate: 0.21, skillRate: 0.07, before: 'ゴクリン' },
  { name: 'チルット', specialty: 'きのみ', berry: 'シーヤ', foodList: [{ name: 'とくせんエッグ', numList: [1, 2, 4] }, { name: 'ワカクサ大豆', numList: [null, 3, 4] }, { name: 'とくせんリンゴ', numList: [null, null, 5] }], skill: 'げんきチャージS', help: 4200, bag: 12, foodRate: 0.177, skillRate: 0.032, before: null },
  { name: 'チルタリス', specialty: 'きのみ', berry: 'ヤチェ', foodList: [{ name: 'とくせんエッグ', numList: [1, 2, 4] }, { name: 'ワカクサ大豆', numList: [null, 3, 4] }, { name: 'とくせんリンゴ', numList: [null, null, 5] }], skill: 'げんきチャージS', help: 3700, bag: 14, foodRate: 0.258, skillRate: 0.061, before: 'チルット' },
  { name: 'カゲボウズ', specialty: 'きのみ', berry: 'ブリー', foodList: [{ name: 'ピュアなオイル', numList: [1, 2, 4] }, { name: 'あったかジンジャー', numList: [null, 2, 4] }, { name: 'あじわいキノコ', numList: [null, null, 3] }], skill: 'エナジーチャージS(ランダム)', help: 3900, bag: 11, foodRate: 0.171, skillRate: 0.026, before: null },
  { name: 'ジュペッタ', specialty: 'きのみ', berry: 'ブリー', foodList: [{ name: 'ピュアなオイル', numList: [1, 2, 4] }, { name: 'あったかジンジャー', numList: [null, 2, 4] }, { name: 'あじわいキノコ', numList: [null, null, 3] }], skill: 'エナジーチャージS(ランダム)', help: 2600, bag: 19, foodRate: 0.179, skillRate: 0.033, before: null },
  { name: 'アブソル', specialty: '食材', berry: 'ウイ', foodList: [{ name: 'リラックスカカオ', numList: [2, 5, 7] }, { name: 'とくせんリンゴ', numList: [null, 8, 12] }, { name: 'あじわいキノコ', numList: [null, null, 7] }], skill: 'エナジーチャージS', help: 3100, bag: 14, foodRate: 0.178, skillRate: 0.038, before: null },
  { name: 'ソーナノ', specialty: 'スキル', berry: 'マゴ', foodList: [{ name: 'とくせんリンゴ', numList: [1, 2, 4] }, { name: 'あじわいキノコ', numList: [null, 1, 2] }, { name: 'ピュアなオイル', numList: [null, null, 3] }], skill: 'げんきエールS', help: 5800, bag: 7, foodRate: 0.213, skillRate: 0.059, before: null },
  { name: 'タマザラシ', specialty: 'きのみ', berry: 'チーゴ', foodList: [{ name: 'ピュアなオイル', numList: [1, 2, 4] }, { name: 'マメミート', numList: [null, 3, 4] }, { name: 'あったかジンジャー', numList: [null, null, 4] }], skill: '食材ゲットS', help: 5600, bag: 9, foodRate: 0.224, skillRate: 0.023, before: null },
  { name: 'トドグラー', specialty: 'きのみ', berry: 'チーゴ', foodList: [{ name: 'ピュアなオイル', numList: [1, 2, 4] }, { name: 'マメミート', numList: [null, 3, 4] }, { name: 'あったかジンジャー', numList: [null, null, 4] }], skill: '食材ゲットS', help: 4000, bag: 13, foodRate: 0.221, skillRate: 0.021, before: 'タマザラシ' },
  { name: 'トドゼルガ', specialty: 'きのみ', berry: 'チーゴ', foodList: [{ name: 'ピュアなオイル', numList: [1, 2, 4] }, { name: 'マメミート', numList: [null, 3, 4] }, { name: 'あったかジンジャー', numList: [null, null, 4] }], skill: '食材ゲットS', help: 3000, bag: 18, foodRate: 0.223, skillRate: 0.022, before: 'トドグラー' },
  { name: 'ウソハチ', specialty: 'スキル', berry: 'オボン', foodList: [{ name: 'あんみんトマト', numList: [1, 2, 4] }, { name: 'ワカクサ大豆', numList: [null, 2, 4] }, { name: 'あじわいキノコ', numList: [null, null, 2] }], skill: 'エナジーチャージM', help: 6300, bag: 8, foodRate: 0.189, skillRate: 0.061, before: null },
  { name: 'マネネ', specialty: '食材', berry: 'マゴ', foodList: [{ name: 'あんみんトマト', numList: [2, 5, 7] }, { name: 'ほっこりポテト', numList: [null, 4, 6] }, { name: 'ふといながねぎ', numList: [null, null, 4] }], skill: 'エナジーチャージS', help: 4300, bag: 10, foodRate: 0.201, skillRate: 0.032, before: null },
  { name: 'リオル', specialty: 'スキル', berry: 'クラボ', foodList: [{ name: 'ピュアなオイル', numList: [1, 2, 4] }, { name: 'ほっこりポテト', numList: [null, 2, 4] }, { name: 'とくせんエッグ', numList: [null, null, 4] }], skill: 'ゆめのかけらゲットS', help: 4200, bag: 9, foodRate: 0.126, skillRate: 0.038, before: null },
  { name: 'ルカリオ', specialty: 'スキル', berry: 'クラボ', foodList: [{ name: 'ピュアなオイル', numList: [1, 2, 4] }, { name: 'ほっこりポテト', numList: [null, 2, 4] }, { name: 'とくせんエッグ', numList: [null, null, 4] }], skill: 'ゆめのかけらゲットS', help: 2600, bag: 14, foodRate: 0.15, skillRate: 0.051, before: 'リオル' },
  { name: 'グレッグル', specialty: '食材', berry: 'カゴ', foodList: [{ name: 'ピュアなオイル', numList: [2, 5, 7] }, { name: 'マメミート', numList: [null, 5, 8] }, null], skill: 'エナジーチャージS', help: 5600, bag: 10, foodRate: 0.228, skillRate: 0.042, before: null },
  { name: 'ドクロッグ', specialty: '食材', berry: 'カゴ', foodList: [{ name: 'ピュアなオイル', numList: [2, 5, 7] }, { name: 'マメミート', numList: [null, 5, 8] }, null], skill: 'エナジーチャージS', help: 3400, bag: 14, foodRate: 0.229, skillRate: 0.043, before: 'グレッグル' },
  { name: 'ユキカブリ', specialty: '食材', berry: 'チーゴ', foodList: [{ name: 'あんみんトマト', numList: [2, 5, 7] }, { name: 'とくせんエッグ', numList: [null, 4, 7] }, { name: 'あじわいキノコ', numList: [null, null, 5] }], skill: 'エナジーチャージS(ランダム)', help: 5600, bag: 10, foodRate: 0.251, skillRate: 0.044, before: null },
  { name: 'ユキノオー', specialty: '食材', berry: 'チーゴ', foodList: [{ name: 'あんみんトマト', numList: [2, 5, 7] }, { name: 'とくせんエッグ', numList: [null, 4, 7] }, { name: 'あじわいキノコ', numList: [null, null, 5] }], skill: 'エナジーチャージS(ランダム)', help: 3000, bag: 21, foodRate: 0.25, skillRate: 0.044, before: 'ユキカブリ' },
  { name: 'ジバコイル', specialty: 'スキル', berry: 'ベリブ', foodList: [{ name: 'ピュアなオイル', numList: [1, 2, 4] }, { name: 'げきからハーブ', numList: [null, 2, 3] }, null], skill: '料理パワーアップS', help: 3100, bag: 13, foodRate: 0.179, skillRate: 0.062, before: 'レアコイル' },
  { name: 'トゲキッス', specialty: 'スキル', berry: 'モモン', foodList: [{ name: 'とくせんエッグ', numList: [1, 2, 4] }, { name: 'あったかジンジャー', numList: [null, 2, 4] }, { name: 'リラックスカカオ', numList: [null, null, 3] }], skill: 'ゆびをふる', help: 2600, bag: 16, foodRate: 0.158, skillRate: 0.053, before: 'トゲチック' },
  { name: 'リーフィア', specialty: 'スキル', berry: 'ドリ', foodList: [{ name: 'モーモーミルク', numList: [1, 2, 4] }, { name: 'リラックスカカオ', numList: [null, 1, 2] }, { name: 'マメミート', numList: [null, null, 3] }], skill: 'げんきエールS', help: 3000, bag: 13, foodRate: 0.205, skillRate: 0.059, before: 'イーブイ' },
  { name: 'グレイシア', specialty: 'スキル', berry: 'チーゴ', foodList: [{ name: 'モーモーミルク', numList: [1, 2, 4] }, { name: 'リラックスカカオ', numList: [null, 1, 2] }, { name: 'マメミート', numList: [null, null, 3] }], skill: '料理パワーアップS', help: 3200, bag: 12, foodRate: 0.219, skillRate: 0.063, before: 'イーブイ' },
  { name: 'ニンフィア', specialty: 'スキル', berry: 'モモン', foodList: [{ name: 'モーモーミルク', numList: [1, 2, 4] }, { name: 'リラックスカカオ', numList: [null, 1, 2] }, { name: 'マメミート', numList: [null, null, 3] }], skill: 'げんきオールS', help: 2600, bag: 15, foodRate: 0.178, skillRate: 0.04, before: 'イーブイ' },
  { name: 'デデンネ', specialty: 'スキル', berry: 'ウブ', foodList: [{ name: 'とくせんリンゴ', numList: [1, 2, 4] }, { name: 'リラックスカカオ', numList: [null, 1, 2] }, { name: 'ワカクサコーン', numList: [null, null, 2] }], skill: '料理チャンスS', help: 2500, bag: 19, foodRate: 0.177, skillRate: 0.045, before: null },
  { name: 'ヌイコグマ', specialty: '食材', berry: 'クラボ', foodList: [{ name: 'ワカクサコーン', numList: [2, 5, 7] }, { name: 'マメミート', numList: [null, 6, 10] }, { name: 'とくせんエッグ', numList: [null, null, 9] }], skill: 'エナジーチャージS(ランダム)', help: 4100, bag: 13, foodRate: 0.225, skillRate: 0.011, before: null },
  { name: 'キテルグマ', specialty: '食材', berry: 'クラボ', foodList: [{ name: 'ワカクサコーン', numList: [2, 5, 7] }, { name: 'マメミート', numList: [null, 6, 10] }, { name: 'とくせんエッグ', numList: [null, null, 9] }], skill: 'エナジーチャージS(ランダム)', help: 2800, bag: 20, foodRate: 0.229, skillRate: 0.013, before: 'ヌイコグマ' },
  { name: 'キュワワー', specialty: '食材', berry: 'モモン', foodList: [{ name: 'ワカクサコーン', numList: [2, 5, 7] }, { name: 'あったかジンジャー', numList: [null, 6, 9] }, { name: 'リラックスカカオ', numList: [null, null, 7] }], skill: 'げんきエールS', help: 2500, bag: 20, foodRate: 0.139, skillRate: 0.022, before: null },
]

let map =  list.reduce((a, x) => (a[x.name] = x, a), {});

// 進化段階を計算
list.filter(x => x.before == null).forEach(x => x.evolveLv = 1)
list.filter(x => map[x.before] && !x.evolveLv).forEach(x => x.evolveLv = map[x.before].evolveLv + 1)
list.filter(x => map[x.before] && !x.evolveLv).forEach(x => x.evolveLv = map[x.before].evolveLv + 1)

// 進化後を整理
for(let pokemon of list) {
  pokemon.type = Berry.map[pokemon.berry].type;

  pokemon.foodMap = pokemon.foodList.filter(x => x).reduce((a, x) => (a[x.name] = x, a), {});

  pokemon.afterList = [];
  let targetList = [pokemon.name];

  while(targetList.length) {
    let newTarget = [];
    for(let target of targetList) {
      let afterList = list.filter(x => x.before == target).map(x => x.name);

      if (afterList.length) {
        newTarget.push(...afterList);
      } else {
        pokemon.afterList.push(target)
      }
    }
    targetList = newTarget;
  }
}

class Pokemon {
  list = [];
  map = {};
}

Pokemon.list = list;
Pokemon.map = map;

export default Pokemon;