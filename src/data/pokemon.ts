import type { FoodType, PokemonType } from "../type";
import Berry from "./berry";
import { Food } from "./food_and_cooking";
import Skill from "./skill";

/**
 * https://docs.google.com/spreadsheets/d/1288GYT929NSGHu-6Yy81A6edmz95iNFo2Kfj5qXC7og/edit#gid=0
 * のV列をコピーして貼り付け
 * ポケモン情報を変更した場合は、models/evaluate-table.js の version を更新すること
 */

class Pokemon {
  static list: PokemonType[] = [
    { name: 'フシギダネ', specialty: '食材', berry: 'ドリ', foodList: ['あまいミツ', 'あんみんトマト', 'ほっこりポテト'], skill: '食材ゲットS', help: 4400, bag: 11, foodRate: 0.257, skillRate: 0.019, legend: false, exp: 1, candyName: 'フシギダネ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'フシギソウ', specialty: '食材', berry: 'ドリ', foodList: ['あまいミツ', 'あんみんトマト', 'ほっこりポテト'], skill: '食材ゲットS', help: 3300, bag: 14, foodRate: 0.255, skillRate: 0.019, legend: false, exp: 1, candyName: 'フシギダネ', evolve: {before: 'フシギダネ', lv: 12, candy: 40, itemList: '', sleep: null }},
    { name: 'フシギバナ', specialty: '食材', berry: 'ドリ', foodList: ['あまいミツ', 'あんみんトマト', 'ほっこりポテト'], skill: '食材ゲットS', help: 2800, bag: 17, foodRate: 0.266, skillRate: 0.021, legend: false, exp: 1, candyName: 'フシギダネ', evolve: {before: 'フシギソウ', lv: 24, candy: 80, itemList: '', sleep: null }},
    { name: 'ヒトカゲ', specialty: '食材', berry: 'ヒメリ', foodList: ['マメミート', 'あったかジンジャー', 'げきからハーブ'], skill: '食材ゲットS', help: 3500, bag: 12, foodRate: 0.201, skillRate: 0.011, legend: false, exp: 1, candyName: 'ヒトカゲ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'リザード', specialty: '食材', berry: 'ヒメリ', foodList: ['マメミート', 'あったかジンジャー', 'げきからハーブ'], skill: '食材ゲットS', help: 3000, bag: 15, foodRate: 0.227, skillRate: 0.016, legend: false, exp: 1, candyName: 'ヒトカゲ', evolve: {before: 'ヒトカゲ', lv: 12, candy: 40, itemList: '', sleep: null }},
    { name: 'リザードン', specialty: '食材', berry: 'ヒメリ', foodList: ['マメミート', 'あったかジンジャー', 'げきからハーブ'], skill: '食材ゲットS', help: 2400, bag: 19, foodRate: 0.224, skillRate: 0.016, legend: false, exp: 1, candyName: 'ヒトカゲ', evolve: {before: 'リザード', lv: 27, candy: 80, itemList: '', sleep: null }},
    { name: 'ゼニガメ', specialty: '食材', berry: 'オレン', foodList: ['モーモーミルク', 'リラックスカカオ', 'マメミート'], skill: '食材ゲットS', help: 4500, bag: 10, foodRate: 0.271, skillRate: 0.02, legend: false, exp: 1, candyName: 'ゼニガメ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'カメール', specialty: '食材', berry: 'オレン', foodList: ['モーモーミルク', 'リラックスカカオ', 'マメミート'], skill: '食材ゲットS', help: 3400, bag: 14, foodRate: 0.271, skillRate: 0.02, legend: false, exp: 1, candyName: 'ゼニガメ', evolve: {before: 'ゼニガメ', lv: 12, candy: 40, itemList: '', sleep: null }},
    { name: 'カメックス', specialty: '食材', berry: 'オレン', foodList: ['モーモーミルク', 'リラックスカカオ', 'マメミート'], skill: '食材ゲットS', help: 2800, bag: 17, foodRate: 0.275, skillRate: 0.021, legend: false, exp: 1, candyName: 'ゼニガメ', evolve: {before: 'カメール', lv: 27, candy: 80, itemList: '', sleep: null }},
    { name: 'キャタピー', specialty: 'きのみ', berry: 'ラム', foodList: ['あまいミツ', 'あんみんトマト', 'ワカクサ大豆'], skill: '食材ゲットS', help: 4400, bag: 11, foodRate: 0.179, skillRate: 0.008, legend: false, exp: 1, candyName: 'キャタピー', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'トランセル', specialty: 'きのみ', berry: 'ラム', foodList: ['あまいミツ', 'あんみんトマト', 'ワカクサ大豆'], skill: '食材ゲットS', help: 4200, bag: 13, foodRate: 0.208, skillRate: 0.018, legend: false, exp: 1, candyName: 'キャタピー', evolve: {before: 'キャタピー', lv: 5, candy: 40, itemList: '', sleep: null }},
    { name: 'バタフリー', specialty: 'きのみ', berry: 'ラム', foodList: ['あまいミツ', 'あんみんトマト', 'ワカクサ大豆'], skill: '食材ゲットS', help: 2500, bag: 21, foodRate: 0.197, skillRate: 0.014, legend: false, exp: 1, candyName: 'キャタピー', evolve: {before: 'トランセル', lv: 8, candy: 80, itemList: '', sleep: null }},
    { name: 'コラッタ', specialty: 'きのみ', berry: 'キー', foodList: ['とくせんリンゴ', 'ワカクサ大豆', 'マメミート'], skill: 'げんきチャージS', help: 4900, bag: 10, foodRate: 0.237, skillRate: 0.03, legend: false, exp: 1, candyName: 'コラッタ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'ラッタ', specialty: 'きのみ', berry: 'キー', foodList: ['とくせんリンゴ', 'ワカクサ大豆', 'マメミート'], skill: 'げんきチャージS', help: 2950, bag: 16, foodRate: 0.237, skillRate: 0.03, legend: false, exp: 1, candyName: 'コラッタ', evolve: {before: 'コラッタ', lv: 15, candy: 40, itemList: '', sleep: null }},
    { name: 'アーボ', specialty: 'きのみ', berry: 'カゴ', foodList: ['マメミート', 'とくせんエッグ', 'げきからハーブ'], skill: 'げんきチャージS', help: 5000, bag: 10, foodRate: 0.235, skillRate: 0.033, legend: false, exp: 1, candyName: 'アーボ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'アーボック', specialty: 'きのみ', berry: 'カゴ', foodList: ['マメミート', 'とくせんエッグ', 'げきからハーブ'], skill: 'げんきチャージS', help: 3400, bag: 14, foodRate: 0.264, skillRate: 0.057, legend: false, exp: 1, candyName: 'アーボ', evolve: {before: 'アーボ', lv: 17, candy: 40, itemList: '', sleep: null }},
    { name: 'ピカチュウ', specialty: 'きのみ', berry: 'ウブ', foodList: ['とくせんリンゴ', 'あったかジンジャー', 'とくせんエッグ'], skill: 'エナジーチャージS', help: 2700, bag: 17, foodRate: 0.207, skillRate: 0.021, legend: false, exp: 1, candyName: 'ピカチュウ', evolve: {before: 'ピチュー', lv: null, candy: 20, itemList: '', sleep: 50 }},
    { name: 'ピカチュウ(ハロウィン)', specialty: 'きのみ', berry: 'ウブ', foodList: ['とくせんリンゴ', 'あったかジンジャー', 'とくせんエッグ'], skill: 'エナジーチャージS(ランダム)', help: 2500, bag: 18, foodRate: 0.218, skillRate: 0.028, legend: false, exp: 1, candyName: 'ピカチュウ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'ピカチュウ(ホリデー)', specialty: 'スキル', berry: 'ウブ', foodList: ['とくせんリンゴ', 'あったかジンジャー', 'とくせんエッグ'], skill: 'ゆめのかけらゲットS', help: 2500, bag: 20, foodRate: 0.131, skillRate: 0.042, legend: false, exp: 1, candyName: 'ピカチュウ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'ライチュウ', specialty: 'きのみ', berry: 'ウブ', foodList: ['とくせんリンゴ', 'あったかジンジャー', 'とくせんエッグ'], skill: 'エナジーチャージS', help: 2200, bag: 21, foodRate: 0.224, skillRate: 0.032, legend: false, exp: 1, candyName: 'ピカチュウ', evolve: {before: 'ピカチュウ', lv: null, candy: 80, itemList: 'かみなりのいし', sleep: null }},
    { name: 'ピッピ', specialty: 'きのみ', berry: 'モモン', foodList: ['とくせんリンゴ', 'あまいミツ', 'ワカクサ大豆'], skill: 'ゆびをふる', help: 4000, bag: 16, foodRate: 0.168, skillRate: 0.036, legend: false, exp: 1, candyName: 'ピッピ', evolve: {before: 'ピィ', lv: null, candy: 20, itemList: '', sleep: 50 }},
    { name: 'ピクシー', specialty: 'きのみ', berry: 'モモン', foodList: ['とくせんリンゴ', 'あまいミツ', 'ワカクサ大豆'], skill: 'ゆびをふる', help: 2800, bag: 20, foodRate: 0.168, skillRate: 0.036, legend: false, exp: 1, candyName: 'ピッピ', evolve: {before: 'ピッピ', lv: null, candy: 80, itemList: 'つきのいし', sleep: null }},
    { name: 'ロコン', specialty: 'きのみ', berry: 'ヒメリ', foodList: ['ワカクサ大豆', 'ワカクサコーン', 'ほっこりポテト'], skill: 'げんきエールS', help: 4700, bag: 13, foodRate: 0.168, skillRate: 0.027, legend: false, exp: 1, candyName: 'ロコン', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'ロコン(アローラのすがた)', specialty: 'きのみ', berry: 'チーゴ', foodList: ['ワカクサ大豆', 'ワカクサコーン', 'ほっこりポテト'], skill: 'おてつだいサポートS', help: 5600, bag: 10, foodRate: 0.23, skillRate: 0.028, legend: false, exp: 1, candyName: 'ロコン', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'キュウコン', specialty: 'きのみ', berry: 'ヒメリ', foodList: ['ワカクサ大豆', 'ワカクサコーン', 'ほっこりポテト'], skill: 'げんきエールS', help: 2600, bag: 23, foodRate: 0.164, skillRate: 0.025, legend: false, exp: 1, candyName: 'ロコン', evolve: {before: 'ロコン', lv: null, candy: 80, itemList: 'ほのおのいし', sleep: null }},
    { name: 'キュウコン(アローラのすがた)', specialty: 'きのみ', berry: 'チーゴ', foodList: ['ワカクサ大豆', 'ワカクサコーン', 'ほっこりポテト'], skill: 'おてつだいサポートS', help: 2900, bag: 20, foodRate: 0.232, skillRate: 0.028, legend: false, exp: 1, candyName: 'ロコン', evolve: {before: 'ロコン(アローラのすがた)', lv: null, candy: 80, itemList: 'こおりのいし', sleep: null }},
    { name: 'プリン', specialty: 'スキル', berry: 'モモン', foodList: ['あまいミツ', 'ピュアなオイル', 'リラックスカカオ'], skill: 'げんきオールS', help: 3900, bag: 9, foodRate: 0.182, skillRate: 0.043, legend: false, exp: 1, candyName: 'プリン', evolve: {before: 'ププリン', lv: null, candy: 20, itemList: '', sleep: 50 }},
    { name: 'プクリン', specialty: 'スキル', berry: 'モモン', foodList: ['あまいミツ', 'ピュアなオイル', 'リラックスカカオ'], skill: 'げんきオールS', help: 2900, bag: 13, foodRate: 0.174, skillRate: 0.04, legend: false, exp: 1, candyName: 'プリン', evolve: {before: 'プリン', lv: null, candy: 80, itemList: 'つきのいし', sleep: null }},
    { name: 'ディグダ', specialty: '食材', berry: 'フィラ', foodList: ['あんみんトマト', 'ふといながねぎ', 'ワカクサ大豆'], skill: 'エナジーチャージS', help: 4300, bag: 10, foodRate: 0.192, skillRate: 0.021, legend: false, exp: 1, candyName: 'ディグダ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'ダグトリオ', specialty: '食材', berry: 'フィラ', foodList: ['あんみんトマト', 'ふといながねぎ', 'ワカクサ大豆'], skill: 'エナジーチャージS', help: 2800, bag: 16, foodRate: 0.19, skillRate: 0.02, legend: false, exp: 1, candyName: 'ディグダ', evolve: {before: 'ディグダ', lv: 20, candy: 40, itemList: '', sleep: null }},
    { name: 'ニャース', specialty: 'スキル', berry: 'キー', foodList: ['モーモーミルク', 'マメミート'], skill: 'ゆめのかけらゲットS', help: 4400, bag: 9, foodRate: 0.163, skillRate: 0.042, legend: false, exp: 1, candyName: 'ニャース', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'ペルシアン', specialty: 'スキル', berry: 'キー', foodList: ['モーモーミルク', 'マメミート'], skill: 'ゆめのかけらゲットS', help: 2800, bag: 12, foodRate: 0.169, skillRate: 0.044, legend: false, exp: 1, candyName: 'ニャース', evolve: {before: 'ニャース', lv: 21, candy: 40, itemList: '', sleep: null }},
    { name: 'コダック', specialty: 'スキル', berry: 'オレン', foodList: ['リラックスカカオ', 'とくせんリンゴ', 'マメミート'], skill: 'エナジーチャージS(ランダム)', help: 5400, bag: 8, foodRate: 0.136, skillRate: 0.126, legend: false, exp: 1, candyName: 'コダック', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'ゴルダック', specialty: 'スキル', berry: 'オレン', foodList: ['リラックスカカオ', 'とくせんリンゴ', 'マメミート'], skill: 'エナジーチャージS(ランダム)', help: 3400, bag: 14, foodRate: 0.162, skillRate: 0.125, legend: false, exp: 1, candyName: 'コダック', evolve: {before: 'コダック', lv: 25, candy: 40, itemList: '', sleep: null }},
    { name: 'マンキー', specialty: 'きのみ', berry: 'クラボ', foodList: ['マメミート', 'あじわいキノコ', 'あまいミツ'], skill: 'エナジーチャージS(ランダム)', help: 4200, bag: 12, foodRate: 0.197, skillRate: 0.022, legend: false, exp: 1, candyName: 'マンキー', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'オコリザル', specialty: 'きのみ', berry: 'クラボ', foodList: ['マメミート', 'あじわいキノコ', 'あまいミツ'], skill: 'エナジーチャージS(ランダム)', help: 2800, bag: 17, foodRate: 0.2, skillRate: 0.024, legend: false, exp: 1, candyName: 'マンキー', evolve: {before: 'マンキー', lv: 21, candy: 40, itemList: '', sleep: null }},
    { name: 'ガーディ', specialty: 'スキル', berry: 'ヒメリ', foodList: ['げきからハーブ', 'マメミート', 'モーモーミルク'], skill: 'おてつだいサポートS', help: 4300, bag: 8, foodRate: 0.138, skillRate: 0.05, legend: false, exp: 1, candyName: 'ガーディ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'ウインディ', specialty: 'スキル', berry: 'ヒメリ', foodList: ['げきからハーブ', 'マメミート', 'モーモーミルク'], skill: 'おてつだいサポートS', help: 2500, bag: 16, foodRate: 0.136, skillRate: 0.049, legend: false, exp: 1, candyName: 'ガーディ', evolve: {before: 'ガーディ', lv: null, candy: 80, itemList: 'ほのおのいし', sleep: null }},
    { name: 'マダツボミ', specialty: '食材', berry: 'ドリ', foodList: ['あんみんトマト', 'ほっこりポテト', 'ふといながねぎ'], skill: 'げんきチャージS', help: 5200, bag: 8, foodRate: 0.233, skillRate: 0.039, legend: false, exp: 1, candyName: 'マダツボミ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'ウツドン', specialty: '食材', berry: 'ドリ', foodList: ['あんみんトマト', 'ほっこりポテト', 'ふといながねぎ'], skill: 'げんきチャージS', help: 3800, bag: 12, foodRate: 0.235, skillRate: 0.04, legend: false, exp: 1, candyName: 'マダツボミ', evolve: {before: 'マダツボミ', lv: 16, candy: 40, itemList: '', sleep: null }},
    { name: 'ウツボット', specialty: '食材', berry: 'ドリ', foodList: ['あんみんトマト', 'ほっこりポテト', 'ふといながねぎ'], skill: 'げんきチャージS', help: 2800, bag: 17, foodRate: 0.233, skillRate: 0.039, legend: false, exp: 1, candyName: 'マダツボミ', evolve: {before: 'ウツドン', lv: null, candy: 80, itemList: 'リーフのいし', sleep: null }},
    { name: 'イシツブテ', specialty: '食材', berry: 'オボン', foodList: ['ワカクサ大豆', 'ほっこりポテト', 'あじわいキノコ'], skill: 'エナジーチャージS(ランダム)', help: 5700, bag: 9, foodRate: 0.281, skillRate: 0.052, legend: false, exp: 1, candyName: 'イシツブテ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'ゴローン', specialty: '食材', berry: 'オボン', foodList: ['ワカクサ大豆', 'ほっこりポテト', 'あじわいキノコ'], skill: 'エナジーチャージS(ランダム)', help: 4000, bag: 12, foodRate: 0.272, skillRate: 0.048, legend: false, exp: 1, candyName: 'イシツブテ', evolve: {before: 'イシツブテ', lv: 19, candy: 40, itemList: '', sleep: null }},
    { name: 'ゴローニャ', specialty: '食材', berry: 'オボン', foodList: ['ワカクサ大豆', 'ほっこりポテト', 'あじわいキノコ'], skill: 'エナジーチャージS(ランダム)', help: 3100, bag: 16, foodRate: 0.28, skillRate: 0.052, legend: false, exp: 1, candyName: 'イシツブテ', evolve: {before: 'ゴローン', lv: null, candy: 80, itemList: 'つながりのヒモ', sleep: null }},
    { name: 'ヤドン', specialty: 'スキル', berry: 'オレン', foodList: ['リラックスカカオ', 'おいしいシッポ', 'あんみんトマト'], skill: 'げんきエールS', help: 5700, bag: 9, foodRate: 0.151, skillRate: 0.067, legend: false, exp: 1, candyName: 'ヤドン', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'ヤドラン', specialty: 'スキル', berry: 'オレン', foodList: ['リラックスカカオ', 'おいしいシッポ', 'あんみんトマト'], skill: 'げんきエールS', help: 3800, bag: 16, foodRate: 0.197, skillRate: 0.068, legend: false, exp: 1, candyName: 'ヤドン', evolve: {before: 'ヤドン', lv: 28, candy: 40, itemList: '', sleep: null }},
    { name: 'コイル', specialty: 'スキル', berry: 'ベリブ', foodList: ['ピュアなオイル', 'げきからハーブ'], skill: '料理パワーアップS', help: 5800, bag: 8, foodRate: 0.182, skillRate: 0.064, legend: false, exp: 1, candyName: 'コイル', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'レアコイル', specialty: 'スキル', berry: 'ベリブ', foodList: ['ピュアなオイル', 'げきからハーブ'], skill: '料理パワーアップS', help: 4000, bag: 11, foodRate: 0.182, skillRate: 0.063, legend: false, exp: 1, candyName: 'コイル', evolve: {before: 'コイル', lv: 23, candy: 40, itemList: '', sleep: null }},
    { name: 'ドードー', specialty: 'きのみ', berry: 'シーヤ', foodList: ['ワカクサ大豆', 'リラックスカカオ', 'マメミート'], skill: 'げんきチャージS', help: 3800, bag: 13, foodRate: 0.184, skillRate: 0.02, legend: false, exp: 1, candyName: 'ドードー', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'ドードリオ', specialty: 'きのみ', berry: 'シーヤ', foodList: ['ワカクサ大豆', 'リラックスカカオ', 'マメミート'], skill: 'げんきチャージS', help: 2300, bag: 21, foodRate: 0.184, skillRate: 0.02, legend: false, exp: 1, candyName: 'ドードー', evolve: {before: 'ドードー', lv: 23, candy: 40, itemList: '', sleep: null }},
    { name: 'ゴース', specialty: '食材', berry: 'ブリー', foodList: ['げきからハーブ', 'あじわいキノコ', 'ピュアなオイル'], skill: 'エナジーチャージS(ランダム)', help: 3800, bag: 10, foodRate: 0.144, skillRate: 0.015, legend: false, exp: 1, candyName: 'ゴース', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'ゴースト', specialty: '食材', berry: 'ブリー', foodList: ['げきからハーブ', 'あじわいキノコ', 'ピュアなオイル'], skill: 'エナジーチャージS(ランダム)', help: 3000, bag: 14, foodRate: 0.157, skillRate: 0.022, legend: false, exp: 1, candyName: 'ゴース', evolve: {before: 'ゴース', lv: 19, candy: 40, itemList: '', sleep: null }},
    { name: 'ゲンガー', specialty: '食材', berry: 'ブリー', foodList: ['げきからハーブ', 'あじわいキノコ', 'ピュアなオイル'], skill: 'エナジーチャージS(ランダム)', help: 2200, bag: 18, foodRate: 0.161, skillRate: 0.024, legend: false, exp: 1, candyName: 'ゴース', evolve: {before: 'ゴースト', lv: null, candy: 80, itemList: 'つながりのヒモ', sleep: null }},
    { name: 'イワーク', specialty: 'きのみ', berry: 'オボン', foodList: ['あんみんトマト', 'マメミート', 'ほっこりポテト'], skill: '食材ゲットS', help: 3100, bag: 22, foodRate: 0.132, skillRate: 0.023, legend: false, exp: 1, candyName: 'イワーク', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'カラカラ', specialty: 'きのみ', berry: 'フィラ', foodList: ['あったかジンジャー', 'リラックスカカオ'], skill: 'げんきチャージS', help: 4800, bag: 10, foodRate: 0.223, skillRate: 0.044, legend: false, exp: 1, candyName: 'カラカラ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'ガラガラ', specialty: 'きのみ', berry: 'フィラ', foodList: ['あったかジンジャー', 'リラックスカカオ'], skill: 'げんきチャージS', help: 3500, bag: 15, foodRate: 0.225, skillRate: 0.045, legend: false, exp: 1, candyName: 'カラカラ', evolve: {before: 'カラカラ', lv: 21, candy: 40, itemList: '', sleep: null }},
    { name: 'ラッキー', specialty: '食材', berry: 'キー', foodList: ['とくせんエッグ', 'ほっこりポテト', 'あまいミツ'], skill: 'げんきオールS', help: 3300, bag: 15, foodRate: 0.236, skillRate: 0.023, legend: false, exp: 1, candyName: 'ラッキー', evolve: {before: 'ピンプク', lv: null, candy: 80, itemList: 'まんまるいし', sleep: null }},
    { name: 'ガルーラ', specialty: '食材', berry: 'キー', foodList: ['あったかジンジャー', 'ほっこりポテト', 'ワカクサ大豆'], skill: '食材ゲットS', help: 2650, bag: 21, foodRate: 0.222, skillRate: 0.017, legend: false, exp: 1, candyName: 'ガルーラ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'バリヤード', specialty: '食材', berry: 'マゴ', foodList: ['あんみんトマト', 'ほっこりポテト', 'ふといながねぎ'], skill: 'ものまね(スキルコピー)', help: 2800, bag: 17, foodRate: 0.216, skillRate: 0.039, legend: false, exp: 1, candyName: 'バリヤード', evolve: {before: 'マネネ', lv: 12, candy: 40, itemList: '', sleep: null }},
    { name: 'カイロス', specialty: '食材', berry: 'ラム', foodList: ['あまいミツ', 'とくせんリンゴ', 'マメミート'], skill: 'エナジーチャージS', help: 2400, bag: 24, foodRate: 0.216, skillRate: 0.031, legend: false, exp: 1, candyName: 'カイロス', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'メタモン', specialty: '食材', berry: 'キー', foodList: ['ピュアなオイル', 'ふといながねぎ', 'おいしいシッポ'], skill: 'へんしん(スキルコピー)', help: 3500, bag: 17, foodRate: 0.201, skillRate: 0.036, legend: false, exp: 1, candyName: 'メタモン', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'イーブイ', specialty: 'スキル', berry: 'キー', foodList: ['モーモーミルク', 'リラックスカカオ', 'マメミート'], skill: '食材ゲットS', help: 3700, bag: 12, foodRate: 0.192, skillRate: 0.055, legend: false, exp: 1, candyName: 'イーブイ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'イーブイ(ホリデー)', specialty: 'きのみ', berry: 'キー', foodList: ['モーモーミルク', 'リラックスカカオ', 'マメミート'], skill: 'ゆめのかけらゲットS', help: 3100, bag: 20, foodRate: 0.156, skillRate: 0.032, legend: false, exp: 1, candyName: 'イーブイ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'シャワーズ', specialty: 'スキル', berry: 'オレン', foodList: ['モーモーミルク', 'リラックスカカオ', 'マメミート'], skill: '食材ゲットS', help: 3100, bag: 13, foodRate: 0.212, skillRate: 0.061, legend: false, exp: 1, candyName: 'イーブイ', evolve: {before: 'イーブイ', lv: null, candy: 80, itemList: 'みずのいし', sleep: null }},
    { name: 'サンダース', specialty: 'スキル', berry: 'ウブ', foodList: ['モーモーミルク', 'リラックスカカオ', 'マメミート'], skill: 'おてつだいサポートS', help: 2200, bag: 17, foodRate: 0.151, skillRate: 0.039, legend: false, exp: 1, candyName: 'イーブイ', evolve: {before: 'イーブイ', lv: null, candy: 80, itemList: 'かみなりのいし', sleep: null }},
    { name: 'ブースター', specialty: 'スキル', berry: 'ヒメリ', foodList: ['モーモーミルク', 'リラックスカカオ', 'マメミート'], skill: '料理パワーアップS', help: 2700, bag: 14, foodRate: 0.185, skillRate: 0.052, legend: false, exp: 1, candyName: 'イーブイ', evolve: {before: 'イーブイ', lv: null, candy: 80, itemList: 'ほのおのいし', sleep: null }},
    { name: 'ミニリュウ', specialty: '食材', berry: 'ヤチェ', foodList: ['げきからハーブ', 'ワカクサコーン', 'ピュアなオイル'], skill: 'げんきチャージS', help: 5000, bag: 9, foodRate: 0.25, skillRate: 0.02, legend: false, exp: 1.5, candyName: 'ミニリュウ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'ハクリュー', specialty: '食材', berry: 'ヤチェ', foodList: ['げきからハーブ', 'ワカクサコーン', 'ピュアなオイル'], skill: 'げんきチャージS', help: 3800, bag: 12, foodRate: 0.262, skillRate: 0.025, legend: false, exp: 1.5, candyName: 'ミニリュウ', evolve: {before: 'ミニリュウ', lv: 23, candy: 40, itemList: '', sleep: null }},
    { name: 'カイリュー', specialty: '食材', berry: 'ヤチェ', foodList: ['げきからハーブ', 'ワカクサコーン', 'ピュアなオイル'], skill: 'げんきチャージS', help: 2600, bag: 20, foodRate: 0.264, skillRate: 0.026, legend: false, exp: 1.5, candyName: 'ミニリュウ', evolve: {before: 'ハクリュー', lv: 41, candy: 100, itemList: '', sleep: null }},
    { name: 'チコリータ', specialty: 'きのみ', berry: 'ドリ', foodList: ['リラックスカカオ', 'あまいミツ', 'ふといながねぎ'], skill: 'エナジーチャージS(ランダム)', help: 4400, bag: 12, foodRate: 0.169, skillRate: 0.039, legend: false, exp: 1, candyName: 'チコリータ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'ベイリーフ', specialty: 'きのみ', berry: 'ドリ', foodList: ['リラックスカカオ', 'あまいミツ', 'ふといながねぎ'], skill: 'エナジーチャージS(ランダム)', help: 3300, bag: 17, foodRate: 0.168, skillRate: 0.038, legend: false, exp: 1, candyName: 'チコリータ', evolve: {before: 'チコリータ', lv: 12, candy: 40, itemList: '', sleep: null }},
    { name: 'メガニウム', specialty: 'きのみ', berry: 'ドリ', foodList: ['リラックスカカオ', 'あまいミツ', 'ふといながねぎ'], skill: 'エナジーチャージS(ランダム)', help: 2800, bag: 20, foodRate: 0.175, skillRate: 0.046, legend: false, exp: 1, candyName: 'チコリータ', evolve: {before: 'ベイリーフ', lv: 24, candy: 80, itemList: '', sleep: null }},
    { name: 'ヒノアラシ', specialty: 'きのみ', berry: 'ヒメリ', foodList: ['あったかジンジャー', 'げきからハーブ', 'ピュアなオイル'], skill: 'エナジーチャージS(ランダム)', help: 3500, bag: 14, foodRate: 0.186, skillRate: 0.021, legend: false, exp: 1, candyName: 'ヒノアラシ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'マグマラシ', specialty: 'きのみ', berry: 'ヒメリ', foodList: ['あったかジンジャー', 'げきからハーブ', 'ピュアなオイル'], skill: 'エナジーチャージS(ランダム)', help: 3000, bag: 18, foodRate: 0.211, skillRate: 0.041, legend: false, exp: 1, candyName: 'ヒノアラシ', evolve: {before: 'ヒノアラシ', lv: 11, candy: 40, itemList: '', sleep: null }},
    { name: 'バクフーン', specialty: 'きのみ', berry: 'ヒメリ', foodList: ['あったかジンジャー', 'げきからハーブ', 'ピュアなオイル'], skill: 'エナジーチャージS(ランダム)', help: 2400, bag: 23, foodRate: 0.208, skillRate: 0.039, legend: false, exp: 1, candyName: 'ヒノアラシ', evolve: {before: 'マグマラシ', lv: 27, candy: 80, itemList: '', sleep: null }},
    { name: 'ワニノコ', specialty: 'きのみ', berry: 'オレン', foodList: ['マメミート', 'ピュアなオイル'], skill: 'エナジーチャージS(ランダム)', help: 4500, bag: 11, foodRate: 0.253, skillRate: 0.052, legend: false, exp: 1, candyName: 'ワニノコ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'アリゲイツ', specialty: 'きのみ', berry: 'オレン', foodList: ['マメミート', 'ピュアなオイル'], skill: 'エナジーチャージS(ランダム)', help: 3400, bag: 15, foodRate: 0.253, skillRate: 0.052, legend: false, exp: 1, candyName: 'ワニノコ', evolve: {before: 'ワニノコ', lv: 14, candy: 40, itemList: '', sleep: null }},
    { name: 'オーダイル', specialty: 'きのみ', berry: 'オレン', foodList: ['マメミート', 'ピュアなオイル'], skill: 'エナジーチャージS(ランダム)', help: 2800, bag: 19, foodRate: 0.257, skillRate: 0.055, legend: false, exp: 1, candyName: 'ワニノコ', evolve: {before: 'アリゲイツ', lv: 23, candy: 80, itemList: '', sleep: null }},
    { name: 'ピチュー', specialty: 'きのみ', berry: 'ウブ', foodList: ['とくせんリンゴ', 'あったかジンジャー', 'とくせんエッグ'], skill: 'エナジーチャージS', help: 4300, bag: 10, foodRate: 0.21, skillRate: 0.023, legend: false, exp: 1, candyName: 'ピカチュウ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'ピィ', specialty: 'きのみ', berry: 'モモン', foodList: ['とくせんリンゴ', 'あまいミツ', 'ワカクサ大豆'], skill: 'ゆびをふる', help: 5600, bag: 10, foodRate: 0.164, skillRate: 0.034, legend: false, exp: 1, candyName: 'ピッピ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'ププリン', specialty: 'スキル', berry: 'モモン', foodList: ['あまいミツ', 'ピュアなオイル', 'リラックスカカオ'], skill: 'げんきオールS', help: 5200, bag: 8, foodRate: 0.17, skillRate: 0.038, legend: false, exp: 1, candyName: 'プリン', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'トゲピー', specialty: 'スキル', berry: 'モモン', foodList: ['とくせんエッグ', 'あったかジンジャー', 'リラックスカカオ'], skill: 'ゆびをふる', help: 4800, bag: 8, foodRate: 0.151, skillRate: 0.049, legend: false, exp: 1, candyName: 'トゲピー', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'トゲチック', specialty: 'スキル', berry: 'モモン', foodList: ['とくせんエッグ', 'あったかジンジャー', 'リラックスカカオ'], skill: 'ゆびをふる', help: 3800, bag: 10, foodRate: 0.163, skillRate: 0.056, legend: false, exp: 1, candyName: 'トゲピー', evolve: {before: 'トゲピー', lv: null, candy: 20, itemList: '', sleep: 50 }},
    { name: 'メリープ', specialty: 'スキル', berry: 'ウブ', foodList: ['げきからハーブ', 'とくせんエッグ'], skill: 'エナジーチャージM', help: 4600, bag: 9, foodRate: 0.128, skillRate: 0.047, legend: false, exp: 1, candyName: 'メリープ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'モココ', specialty: 'スキル', berry: 'ウブ', foodList: ['げきからハーブ', 'とくせんエッグ'], skill: 'エナジーチャージM', help: 3300, bag: 11, foodRate: 0.127, skillRate: 0.046, legend: false, exp: 1, candyName: 'メリープ', evolve: {before: 'メリープ', lv: 11, candy: 40, itemList: '', sleep: null }},
    { name: 'デンリュウ', specialty: 'スキル', berry: 'ウブ', foodList: ['げきからハーブ', 'とくせんエッグ'], skill: 'エナジーチャージM', help: 2500, bag: 15, foodRate: 0.13, skillRate: 0.047, legend: false, exp: 1, candyName: 'メリープ', evolve: {before: 'モココ', lv: 23, candy: 80, itemList: '', sleep: null }},
    { name: 'ウソッキー', specialty: 'スキル', berry: 'オボン', foodList: ['あんみんトマト', 'ワカクサ大豆', 'あじわいキノコ'], skill: 'エナジーチャージM', help: 4000, bag: 16, foodRate: 0.217, skillRate: 0.072, legend: false, exp: 1, candyName: 'ウソッキー', evolve: {before: 'ウソハチ', lv: 12, candy: 20, itemList: '', sleep: null }},
    { name: 'ウパー', specialty: '食材', berry: 'オレン', foodList: ['あじわいキノコ', 'ほっこりポテト', 'マメミート'], skill: 'げんきチャージS', help: 5900, bag: 10, foodRate: 0.201, skillRate: 0.038, legend: false, exp: 1, candyName: 'ウパー', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'ウパー(パルデアのすがた)', specialty: '食材', berry: 'カゴ', foodList: ['リラックスカカオ', 'めざましコーヒー', 'ほっこりポテト'], skill: 'げんきチャージS', help: 6400, bag: 9, foodRate: 0.209, skillRate: 0.056, legend: false, exp: 1, candyName: 'ウパー', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'ヌオー', specialty: '食材', berry: 'オレン', foodList: ['あじわいキノコ', 'ほっこりポテト', 'マメミート'], skill: 'げんきチャージS', help: 3400, bag: 16, foodRate: 0.19, skillRate: 0.032, legend: false, exp: 1, candyName: 'ウパー', evolve: {before: 'ウパー', lv: 15, candy: 40, itemList: '', sleep: null }},
    { name: 'エーフィ', specialty: 'スキル', berry: 'マゴ', foodList: ['モーモーミルク', 'リラックスカカオ', 'マメミート'], skill: 'エナジーチャージM', help: 2400, bag: 16, foodRate: 0.164, skillRate: 0.044, legend: false, exp: 1, candyName: 'イーブイ', evolve: {before: 'イーブイ', lv: null, candy: 80, itemList: '', sleep: 150 }},
    { name: 'ブラッキー', specialty: 'スキル', berry: 'ウイ', foodList: ['モーモーミルク', 'リラックスカカオ', 'マメミート'], skill: 'つきのひかり(げんきチャージS)', help: 3200, bag: 14, foodRate: 0.219, skillRate: 0.101, legend: false, exp: 1, candyName: 'イーブイ', evolve: {before: 'イーブイ', lv: null, candy: 80, itemList: '', sleep: 150 }},
    { name: 'ヤミカラス', specialty: 'スキル', berry: 'ウイ', foodList: ['めざましコーヒー', 'ワカクサ大豆', 'げきからハーブ'], skill: 'きょううん(食材セレクトS)', help: 3600, bag: 13, foodRate: 0.141, skillRate: 0.062, legend: false, exp: 1, candyName: 'ヤミカラス', evolve: {before: null, lv: null, candy: 80, itemList: 'やみのいし', sleep: null }},
    { name: 'ヤドキング', specialty: 'スキル', berry: 'オレン', foodList: ['リラックスカカオ', 'おいしいシッポ', 'あんみんトマト'], skill: 'げんきエールS', help: 3400, bag: 17, foodRate: 0.166, skillRate: 0.074, legend: false, exp: 1, candyName: 'ヤドン', evolve: {before: 'ヤドン', lv: null, candy: 80, itemList: 'つながりのヒモ,おうじゃのしるし', sleep: null }},
    { name: 'ソーナンス', specialty: 'スキル', berry: 'マゴ', foodList: ['とくせんリンゴ', 'あじわいキノコ', 'ピュアなオイル'], skill: 'げんきエールS', help: 3500, bag: 16, foodRate: 0.211, skillRate: 0.07, legend: false, exp: 1, candyName: 'ソーナノ', evolve: {before: 'ソーナノ', lv: 11, candy: 20, itemList: '', sleep: null }},
    { name: 'ハガネール', specialty: 'きのみ', berry: 'ベリブ', foodList: ['あんみんトマト', 'マメミート', 'ほっこりポテト'], skill: '食材ゲットS', help: 3000, bag: 15, foodRate: 0.154, skillRate: 0.032, legend: false, exp: 1, candyName: 'イワーク', evolve: {before: 'イワーク', lv: null, candy: 80, itemList: 'メタルコート,つながりのヒモ', sleep: null }},
    { name: 'ヘラクロス', specialty: 'スキル', berry: 'ラム', foodList: ['あまいミツ', 'あじわいキノコ', 'マメミート'], skill: '食材ゲットS', help: 2300, bag: 20, foodRate: 0.158, skillRate: 0.047, legend: false, exp: 1, candyName: 'ヘラクロス', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'ニューラ', specialty: 'きのみ', berry: 'ウイ', foodList: ['マメミート', 'とくせんエッグ', 'ワカクサ大豆'], skill: '料理チャンスS', help: 3200, bag: 17, foodRate: 0.255, skillRate: 0.019, legend: false, exp: 1, candyName: 'ニューラ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'マニューラ', specialty: 'きのみ', berry: 'ウイ', foodList: ['マメミート', 'とくせんエッグ', 'ワカクサ大豆'], skill: '料理チャンスS', help: 2700, bag: 21, foodRate: 0.251, skillRate: 0.018, legend: false, exp: 1, candyName: 'ニューラ', evolve: {before: 'ニューラ', lv: null, candy: 80, itemList: 'するどいツメ', sleep: null }},
    { name: 'デリバード', specialty: '食材', berry: 'シーヤ', foodList: ['とくせんエッグ', 'とくせんリンゴ', 'リラックスカカオ'], skill: '食材ゲットS', help: 2500, bag: 20, foodRate: 0.188, skillRate: 0.015, legend: false, exp: 1, candyName: 'デリバード', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'デルビル', specialty: 'きのみ', berry: 'ウイ', foodList: ['げきからハーブ', 'あったかジンジャー', 'ふといながねぎ'], skill: 'エナジーチャージM', help: 4900, bag: 10, foodRate: 0.201, skillRate: 0.037, legend: false, exp: 1, candyName: 'デルビル', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'ヘルガー', specialty: 'きのみ', berry: 'ウイ', foodList: ['げきからハーブ', 'あったかジンジャー', 'ふといながねぎ'], skill: 'エナジーチャージM', help: 3300, bag: 16, foodRate: 0.203, skillRate: 0.04, legend: false, exp: 1, candyName: 'デルビル', evolve: {before: 'デルビル', lv: 18, candy: 40, itemList: '', sleep: null }},
    { name: 'ハピナス', specialty: '食材', berry: 'キー', foodList: ['とくせんエッグ', 'ほっこりポテト', 'あまいミツ'], skill: 'げんきオールS', help: 3100, bag: 21, foodRate: 0.238, skillRate: 0.023, legend: false, exp: 1, candyName: 'ラッキー', evolve: {before: 'ラッキー', lv: null, candy: 80, itemList: '', sleep: 150 }},
    { name: 'ライコウ', specialty: 'スキル', berry: 'ウブ', foodList: ['マメミート', 'げきからハーブ', 'ふといながねぎ'], skill: 'おてつだいブースト', help: 2100, bag: 22, foodRate: 0.192, skillRate: 0.019, legend: true, exp: 1.8, candyName: 'ライコウ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'エンテイ', specialty: 'スキル', berry: 'ヒメリ', foodList: ['ピュアなオイル', 'あんみんトマト', 'あじわいキノコ'], skill: 'おてつだいブースト', help: 2400, bag: 19, foodRate: 0.187, skillRate: 0.023, legend: true, exp: 1.8, candyName: 'エンテイ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'スイクン', specialty: 'スキル', berry: 'オレン', foodList: ['とくせんリンゴ', 'ピュアなオイル', 'ワカクサコーン'], skill: 'おてつだいブースト', help: 2700, bag: 17, foodRate: 0.277, skillRate: 0.026, legend: true, exp: 1.8, candyName: 'スイクン', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'ヨーギラス', specialty: '食材', berry: 'オボン', foodList: ['あったかジンジャー', 'ワカクサ大豆', 'マメミート'], skill: 'げんきチャージS', help: 4800, bag: 9, foodRate: 0.238, skillRate: 0.041, legend: false, exp: 1.5, candyName: 'ヨーギラス', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'サナギラス', specialty: '食材', berry: 'オボン', foodList: ['あったかジンジャー', 'ワカクサ大豆', 'マメミート'], skill: 'げんきチャージS', help: 3600, bag: 13, foodRate: 0.247, skillRate: 0.045, legend: false, exp: 1.5, candyName: 'ヨーギラス', evolve: {before: 'ヨーギラス', lv: 23, candy: 40, itemList: '', sleep: null }},
    { name: 'バンギラス', specialty: '食材', berry: 'ウイ', foodList: ['あったかジンジャー', 'ワカクサ大豆', 'マメミート'], skill: 'げんきチャージS', help: 2700, bag: 19, foodRate: 0.266, skillRate: 0.052, legend: false, exp: 1.5, candyName: 'ヨーギラス', evolve: {before: 'サナギラス', lv: 41, candy: 100, itemList: '', sleep: null }},
    { name: 'ラルトス', specialty: 'スキル', berry: 'マゴ', foodList: ['とくせんリンゴ', 'ワカクサコーン', 'ふといながねぎ'], skill: 'げんきオールS', help: 4800, bag: 9, foodRate: 0.145, skillRate: 0.043, legend: false, exp: 1, candyName: 'ラルトス', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'キルリア', specialty: 'スキル', berry: 'マゴ', foodList: ['とくせんリンゴ', 'ワカクサコーン', 'ふといながねぎ'], skill: 'げんきオールS', help: 3500, bag: 13, foodRate: 0.146, skillRate: 0.043, legend: false, exp: 1, candyName: 'ラルトス', evolve: {before: 'ラルトス', lv: 15, candy: 40, itemList: '', sleep: null }},
    { name: 'サーナイト', specialty: 'スキル', berry: 'マゴ', foodList: ['とくせんリンゴ', 'ワカクサコーン', 'ふといながねぎ'], skill: 'げんきオールS', help: 2400, bag: 18, foodRate: 0.144, skillRate: 0.042, legend: false, exp: 1, candyName: 'ラルトス', evolve: {before: 'キルリア', lv: 23, candy: 80, itemList: '', sleep: null }},
    { name: 'エルレイド', specialty: 'スキル', berry: 'クラボ', foodList: ['とくせんリンゴ', 'ワカクサコーン', 'ふといながねぎ'], skill: 'おてつだいサポートS', help: 2400, bag: 19, foodRate: 0.147, skillRate: 0.054, legend: false, exp: 1, candyName: 'ラルトス', evolve: {before: 'キルリア', lv: null, candy: 80, itemList: 'めざめいし', sleep: null }},
    { name: 'ナマケロ', specialty: 'きのみ', berry: 'キー', foodList: ['あんみんトマト', 'あまいミツ', 'とくせんリンゴ'], skill: '食材ゲットS', help: 4900, bag: 7, foodRate: 0.216, skillRate: 0.019, legend: false, exp: 1, candyName: 'ナマケロ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'ヤルキモノ', specialty: 'きのみ', berry: 'キー', foodList: ['あんみんトマト', 'あまいミツ', 'とくせんリンゴ'], skill: '食材ゲットS', help: 3200, bag: 9, foodRate: 0.204, skillRate: 0.015, legend: false, exp: 1, candyName: 'ナマケロ', evolve: {before: 'ナマケロ', lv: 14, candy: 40, itemList: '', sleep: null }},
    { name: 'ケッキング', specialty: 'きのみ', berry: 'キー', foodList: ['あんみんトマト', 'あまいミツ', 'とくせんリンゴ'], skill: '食材ゲットS', help: 3600, bag: 16, foodRate: 0.339, skillRate: 0.067, legend: false, exp: 1, candyName: 'ナマケロ', evolve: {before: 'ヤルキモノ', lv: 27, candy: 80, itemList: '', sleep: null }},
    { name: 'ヤミラミ', specialty: 'スキル', berry: 'ウイ', foodList: ['ピュアなオイル', 'あじわいキノコ', 'リラックスカカオ'], skill: 'ゆめのかけらゲットS(ランダム)', help: 3600, bag: 16, foodRate: 0.188, skillRate: 0.068, legend: false, exp: 1, candyName: 'ヤミラミ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'ココドラ', specialty: '食材', berry: 'ベリブ', foodList: ['マメミート', 'めざましコーヒー', 'ワカクサ大豆'], skill: 'げんきチャージS', help: 5700, bag: 10, foodRate: 0.273, skillRate: 0.046, legend: false, exp: 1, candyName: 'ココドラ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'コドラ', specialty: '食材', berry: 'ベリブ', foodList: ['マメミート', 'めざましコーヒー', 'ワカクサ大豆'], skill: 'げんきチャージS', help: 4200, bag: 13, foodRate: 0.277, skillRate: 0.048, legend: false, exp: 1, candyName: 'ココドラ', evolve: {before: 'ココドラ', lv: 24, candy: 40, itemList: '', sleep: null }},
    { name: 'ボスゴドラ', specialty: '食材', berry: 'ベリブ', foodList: ['マメミート', 'めざましコーヒー', 'ワカクサ大豆'], skill: 'げんきチャージS', help: 3000, bag: 18, foodRate: 0.285, skillRate: 0.052, legend: false, exp: 1, candyName: 'ココドラ', evolve: {before: 'コドラ', lv: 32, candy: 80, itemList: '', sleep: null }},
    { name: 'ゴクリン', specialty: 'スキル', berry: 'カゴ', foodList: ['ワカクサ大豆', 'あじわいキノコ', 'あまいミツ'], skill: 'ゆめのかけらゲットS(ランダム)', help: 5900, bag: 8, foodRate: 0.214, skillRate: 0.063, legend: false, exp: 1, candyName: 'ゴクリン', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'マルノーム', specialty: 'スキル', berry: 'カゴ', foodList: ['ワカクサ大豆', 'あじわいキノコ', 'あまいミツ'], skill: 'ゆめのかけらゲットS(ランダム)', help: 3500, bag: 19, foodRate: 0.21, skillRate: 0.07, legend: false, exp: 1, candyName: 'ゴクリン', evolve: {before: 'ゴクリン', lv: 20, candy: 40, itemList: '', sleep: null }},
    { name: 'チルット', specialty: 'きのみ', berry: 'シーヤ', foodList: ['とくせんエッグ', 'ワカクサ大豆', 'とくせんリンゴ'], skill: 'げんきチャージS', help: 4200, bag: 12, foodRate: 0.177, skillRate: 0.032, legend: false, exp: 1, candyName: 'チルット', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'チルタリス', specialty: 'きのみ', berry: 'ヤチェ', foodList: ['とくせんエッグ', 'ワカクサ大豆', 'とくせんリンゴ'], skill: 'げんきチャージS', help: 3500, bag: 14, foodRate: 0.258, skillRate: 0.061, legend: false, exp: 1, candyName: 'チルット', evolve: {before: 'チルット', lv: 26, candy: 40, itemList: '', sleep: null }},
    { name: 'カゲボウズ', specialty: 'きのみ', berry: 'ブリー', foodList: ['ピュアなオイル', 'あったかジンジャー', 'あじわいキノコ'], skill: 'エナジーチャージS(ランダム)', help: 3900, bag: 11, foodRate: 0.171, skillRate: 0.026, legend: false, exp: 1, candyName: 'カゲボウズ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'ジュペッタ', specialty: 'きのみ', berry: 'ブリー', foodList: ['ピュアなオイル', 'あったかジンジャー', 'あじわいキノコ'], skill: 'エナジーチャージS(ランダム)', help: 2600, bag: 19, foodRate: 0.179, skillRate: 0.033, legend: false, exp: 1, candyName: 'カゲボウズ', evolve: {before: 'カゲボウズ', lv: 28, candy: 40, itemList: '', sleep: null }},
    { name: 'アブソル', specialty: '食材', berry: 'ウイ', foodList: ['リラックスカカオ', 'とくせんリンゴ', 'あじわいキノコ'], skill: 'エナジーチャージS', help: 2950, bag: 21, foodRate: 0.178, skillRate: 0.038, legend: false, exp: 1, candyName: 'アブソル', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'ソーナノ', specialty: 'スキル', berry: 'マゴ', foodList: ['とくせんリンゴ', 'あじわいキノコ', 'ピュアなオイル'], skill: 'げんきエールS', help: 5800, bag: 7, foodRate: 0.213, skillRate: 0.059, legend: false, exp: 1, candyName: 'ソーナノ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'タマザラシ', specialty: 'きのみ', berry: 'チーゴ', foodList: ['ピュアなオイル', 'マメミート', 'あったかジンジャー'], skill: '食材ゲットS', help: 5600, bag: 9, foodRate: 0.224, skillRate: 0.023, legend: false, exp: 1, candyName: 'タマザラシ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'トドグラー', specialty: 'きのみ', berry: 'チーゴ', foodList: ['ピュアなオイル', 'マメミート', 'あったかジンジャー'], skill: '食材ゲットS', help: 4000, bag: 13, foodRate: 0.221, skillRate: 0.021, legend: false, exp: 1, candyName: 'タマザラシ', evolve: {before: 'タマザラシ', lv: 24, candy: 40, itemList: '', sleep: null }},
    { name: 'トドゼルガ', specialty: 'きのみ', berry: 'チーゴ', foodList: ['ピュアなオイル', 'マメミート', 'あったかジンジャー'], skill: '食材ゲットS', help: 3000, bag: 18, foodRate: 0.223, skillRate: 0.022, legend: false, exp: 1, candyName: 'タマザラシ', evolve: {before: 'トドグラー', lv: 33, candy: 80, itemList: '', sleep: null }},
    { name: 'コリンク', specialty: '食材', berry: 'ウブ', foodList: ['あんみんトマト', 'ピュアなオイル', 'めざましコーヒー'], skill: '料理パワーアップS', help: 4400, bag: 11, foodRate: 0.181, skillRate: 0.018, legend: false, exp: 1, candyName: 'コリンク', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'ルクシオ', specialty: '食材', berry: 'ウブ', foodList: ['あんみんトマト', 'ピュアなオイル', 'めざましコーヒー'], skill: '料理パワーアップS', help: 3200, bag: 16, foodRate: 0.182, skillRate: 0.018, legend: false, exp: 1, candyName: 'コリンク', evolve: {before: 'コリンク', lv: 11, candy: 40, itemList: '', sleep: null }},
    { name: 'レントラー', specialty: '食材', berry: 'ウブ', foodList: ['あんみんトマト', 'ピュアなオイル', 'めざましコーヒー'], skill: '料理パワーアップS', help: 2400, bag: 21, foodRate: 0.2, skillRate: 0.023, legend: false, exp: 1, candyName: 'コリンク', evolve: {before: 'ルクシオ', lv: 23, candy: 80, itemList: '', sleep: null }},
    { name: 'フワンテ', specialty: 'スキル', berry: 'ブリー', foodList: ['ワカクサコーン', 'ピュアなオイル', 'ほっこりポテト'], skill: 'たくわえる(エナジーチャージS)', help: 4800, bag: 9, foodRate: 0.137, skillRate: 0.069, legend: false, exp: 1, candyName: 'フワンテ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'フワライド', specialty: 'スキル', berry: 'ブリー', foodList: ['ワカクサコーン', 'ピュアなオイル', 'ほっこりポテト'], skill: 'たくわえる(エナジーチャージS)', help: 2500, bag: 17, foodRate: 0.128, skillRate: 0.061, legend: false, exp: 1, candyName: 'フワンテ', evolve: {before: 'フワンテ', lv: 21, candy: 40, itemList: '', sleep: null }},
    { name: 'ドンカラス', specialty: 'スキル', berry: 'ウイ', foodList: ['めざましコーヒー', 'ワカクサ大豆', 'げきからハーブ'], skill: 'きょううん(食材セレクトS)', help: 3200, bag: 18, foodRate: 0.143, skillRate: 0.067, legend: false, exp: 1, candyName: 'ヤミカラス', evolve: {before: 'ヤミカラス', lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'ウソハチ', specialty: 'スキル', berry: 'オボン', foodList: ['あんみんトマト', 'ワカクサ大豆', 'あじわいキノコ'], skill: 'エナジーチャージM', help: 6300, bag: 8, foodRate: 0.189, skillRate: 0.061, legend: false, exp: 1, candyName: 'ウソッキー', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'マネネ', specialty: '食材', berry: 'マゴ', foodList: ['あんみんトマト', 'ほっこりポテト', 'ふといながねぎ'], skill: 'ものまね(スキルコピー)', help: 4300, bag: 10, foodRate: 0.201, skillRate: 0.032, legend: false, exp: 1, candyName: 'バリヤード', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'ピンプク', specialty: '食材', berry: 'キー', foodList: ['とくせんエッグ', 'ほっこりポテト', 'あまいミツ'], skill: 'げんきオールS', help: 4500, bag: 7, foodRate: 0.21, skillRate: 0.013, legend: false, exp: 1, candyName: 'ラッキー', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'リオル', specialty: 'スキル', berry: 'クラボ', foodList: ['ピュアなオイル', 'ほっこりポテト', 'とくせんエッグ'], skill: 'ゆめのかけらゲットS', help: 4200, bag: 9, foodRate: 0.126, skillRate: 0.038, legend: false, exp: 1, candyName: 'ルカリオ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'ルカリオ', specialty: 'スキル', berry: 'クラボ', foodList: ['ピュアなオイル', 'ほっこりポテト', 'とくせんエッグ'], skill: 'ゆめのかけらゲットS', help: 2600, bag: 14, foodRate: 0.15, skillRate: 0.051, legend: false, exp: 1, candyName: 'ルカリオ', evolve: {before: 'リオル', lv: null, candy: 80, itemList: '', sleep: 150 }},
    { name: 'グレッグル', specialty: '食材', berry: 'カゴ', foodList: ['ピュアなオイル', 'マメミート'], skill: 'エナジーチャージS', help: 5600, bag: 10, foodRate: 0.228, skillRate: 0.042, legend: false, exp: 1, candyName: 'グレッグル', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'ドクロッグ', specialty: '食材', berry: 'カゴ', foodList: ['ピュアなオイル', 'マメミート'], skill: 'エナジーチャージS', help: 3400, bag: 14, foodRate: 0.229, skillRate: 0.043, legend: false, exp: 1, candyName: 'グレッグル', evolve: {before: 'グレッグル', lv: 28, candy: 40, itemList: '', sleep: null }},
    { name: 'ユキカブリ', specialty: '食材', berry: 'チーゴ', foodList: ['あんみんトマト', 'とくせんエッグ', 'あじわいキノコ'], skill: 'エナジーチャージS(ランダム)', help: 5600, bag: 10, foodRate: 0.251, skillRate: 0.044, legend: false, exp: 1, candyName: 'ユキカブリ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'ユキノオー', specialty: '食材', berry: 'チーゴ', foodList: ['あんみんトマト', 'とくせんエッグ', 'あじわいキノコ'], skill: 'エナジーチャージS(ランダム)', help: 3000, bag: 21, foodRate: 0.25, skillRate: 0.044, legend: false, exp: 1, candyName: 'ユキカブリ', evolve: {before: 'ユキカブリ', lv: 30, candy: 40, itemList: '', sleep: null }},
    { name: 'ジバコイル', specialty: 'スキル', berry: 'ベリブ', foodList: ['ピュアなオイル', 'げきからハーブ'], skill: '料理パワーアップS', help: 3100, bag: 13, foodRate: 0.179, skillRate: 0.062, legend: false, exp: 1, candyName: 'コイル', evolve: {before: 'レアコイル', lv: null, candy: 80, itemList: 'かみなりのいし', sleep: null }},
    { name: 'トゲキッス', specialty: 'スキル', berry: 'モモン', foodList: ['とくせんエッグ', 'あったかジンジャー', 'リラックスカカオ'], skill: 'ゆびをふる', help: 2600, bag: 16, foodRate: 0.158, skillRate: 0.053, legend: false, exp: 1, candyName: 'トゲピー', evolve: {before: 'トゲチック', lv: null, candy: 80, itemList: 'ひかりのいし', sleep: null }},
    { name: 'リーフィア', specialty: 'スキル', berry: 'ドリ', foodList: ['モーモーミルク', 'リラックスカカオ', 'マメミート'], skill: 'げんきエールS', help: 3000, bag: 13, foodRate: 0.205, skillRate: 0.059, legend: false, exp: 1, candyName: 'イーブイ', evolve: {before: 'イーブイ', lv: null, candy: 80, itemList: 'リーフのいし', sleep: null }},
    { name: 'グレイシア', specialty: 'スキル', berry: 'チーゴ', foodList: ['モーモーミルク', 'リラックスカカオ', 'マメミート'], skill: '料理パワーアップS', help: 3200, bag: 12, foodRate: 0.219, skillRate: 0.063, legend: false, exp: 1, candyName: 'イーブイ', evolve: {before: 'イーブイ', lv: null, candy: 80, itemList: 'こおりのいし', sleep: null }},
    { name: 'クレセリア', specialty: 'スキル', berry: 'マゴ', foodList: ['あったかジンジャー', 'リラックスカカオ', 'あんみんトマト'], skill: 'みかづきのいのり(げんきオールS)', help: 2300, bag: 22, foodRate: 0.239, skillRate: 0.041, legend: true, exp: 1.8, candyName: 'クレセリア', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'ダークライ', specialty: 'オール', berry: 'ウイ', foodList: ['とくせんリンゴ', 'げきからハーブ', 'モーモーミルク', 'あまいミツ', 'ワカクサ大豆', 'ワカクサコーン', 'めざましコーヒー', 'マメミート'], skill: 'ナイトメア(エナジーチャージM)', help: 2900, bag: 28, foodRate: 0.192, skillRate: 0.023, legend: true, exp: 2.2, candyName: 'ダークライ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'ムンナ', specialty: 'きのみ', berry: 'マゴ', foodList: ['モーモーミルク', 'あまいミツ', 'めざましコーヒー'], skill: 'ゆめのかけらゲットS(ランダム)', help: 5700, bag: 12, foodRate: 0.197, skillRate: 0.043, legend: false, exp: 1, candyName: 'ムンナ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'ムシャーナ', specialty: 'きのみ', berry: 'マゴ', foodList: ['モーモーミルク', 'あまいミツ', 'めざましコーヒー'], skill: 'ゆめのかけらゲットS(ランダム)', help: 2800, bag: 23, foodRate: 0.188, skillRate: 0.041, legend: false, exp: 1, candyName: 'ムンナ', evolve: {before: 'ムンナ', lv: null, candy: 80, itemList: '', sleep: null }},
    { name: 'ワシボン', specialty: 'スキル', berry: 'シーヤ', foodList: ['マメミート', 'ワカクサコーン', 'めざましコーヒー'], skill: 'きのみバースト', help: 3800, bag: 10, foodRate: 0.125, skillRate: 0.031, legend: false, exp: 1, candyName: 'ワシボン', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'ウォーグル', specialty: 'スキル', berry: 'シーヤ', foodList: ['マメミート', 'ワカクサコーン', 'めざましコーヒー'], skill: 'きのみバースト', help: 2400, bag: 18, foodRate: 0.121, skillRate: 0.032, legend: false, exp: 1, candyName: 'ワシボン', evolve: {before: 'ワシボン', lv: 41, candy: 40, itemList: '', sleep: null }},
    { name: 'ニンフィア', specialty: 'スキル', berry: 'モモン', foodList: ['モーモーミルク', 'リラックスカカオ', 'マメミート'], skill: 'げんきオールS', help: 2600, bag: 15, foodRate: 0.178, skillRate: 0.04, legend: false, exp: 1, candyName: 'イーブイ', evolve: {before: 'イーブイ', lv: null, candy: 80, itemList: '', sleep: 150 }},
    { name: 'デデンネ', specialty: 'スキル', berry: 'ウブ', foodList: ['とくせんリンゴ', 'リラックスカカオ', 'ワカクサコーン'], skill: '料理チャンスS', help: 2500, bag: 19, foodRate: 0.177, skillRate: 0.045, legend: false, exp: 1, candyName: 'デデンネ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'アゴジムシ', specialty: '食材', berry: 'ラム', foodList: ['めざましコーヒー', 'あじわいキノコ', 'あまいミツ'], skill: 'エナジーチャージS', help: 4600, bag: 11, foodRate: 0.155, skillRate: 0.029, legend: false, exp: 1, candyName: 'アゴジムシ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'デンヂムシ', specialty: '食材', berry: 'ラム', foodList: ['めざましコーヒー', 'あじわいキノコ', 'あまいミツ'], skill: 'エナジーチャージS', help: 3300, bag: 15, foodRate: 0.154, skillRate: 0.028, legend: false, exp: 1, candyName: 'アゴジムシ', evolve: {before: 'アゴジムシ', lv: 15, candy: 40, itemList: '', sleep: null }},
    { name: 'クワガノン', specialty: '食材', berry: 'ラム', foodList: ['めざましコーヒー', 'あじわいキノコ', 'あまいミツ'], skill: 'エナジーチャージS', help: 2800, bag: 19, foodRate: 0.194, skillRate: 0.051, legend: false, exp: 1, candyName: 'アゴジムシ', evolve: {before: 'デンヂムシ', lv: null, candy: 80, itemList: 'かみなりのいし', sleep: null }},
    { name: 'ヌイコグマ', specialty: '食材', berry: 'クラボ', foodList: ['ワカクサコーン', 'マメミート', 'とくせんエッグ'], skill: 'エナジーチャージS(ランダム)', help: 4100, bag: 13, foodRate: 0.225, skillRate: 0.011, legend: false, exp: 1, candyName: 'ヌイコグマ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'キテルグマ', specialty: '食材', berry: 'クラボ', foodList: ['ワカクサコーン', 'マメミート', 'とくせんエッグ'], skill: 'エナジーチャージS(ランダム)', help: 2800, bag: 20, foodRate: 0.229, skillRate: 0.013, legend: false, exp: 1, candyName: 'ヌイコグマ', evolve: {before: 'ヌイコグマ', lv: 20, candy: 40, itemList: '', sleep: null }},
    { name: 'キュワワー', specialty: '食材', berry: 'モモン', foodList: ['ワカクサコーン', 'あったかジンジャー', 'リラックスカカオ'], skill: 'げんきエールS', help: 2500, bag: 20, foodRate: 0.167, skillRate: 0.03, legend: false, exp: 1, candyName: 'キュワワー', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'ミミッキュ', specialty: 'スキル', berry: 'ブリー', foodList: ['とくせんリンゴ', 'めざましコーヒー', 'あじわいキノコ'], skill: 'ばけのかわ(きのみバースト)', help: 2500, bag: 19, foodRate: 0.153, skillRate: 0.033, legend: false, exp: 1, candyName: 'ミミッキュ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'ウッウ', specialty: '食材', berry: 'シーヤ', foodList: ['ピュアなオイル', 'ほっこりポテト', 'とくせんエッグ'], skill: '料理チャンスS', help: 2700, bag: 19, foodRate: 0.165, skillRate: 0.039, legend: false, exp: 1, candyName: 'ウッウ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'ニャオハ', specialty: '食材', berry: 'ドリ', foodList: ['ほっこりポテト', 'モーモーミルク', 'あったかジンジャー'], skill: '料理パワーアップS', help: 4600, bag: 10, foodRate: 0.208, skillRate: 0.023, legend: false, exp: 1, candyName: 'ニャオハ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'ニャローテ', specialty: '食材', berry: 'ドリ', foodList: ['ほっこりポテト', 'モーモーミルク', 'あったかジンジャー'], skill: '料理パワーアップS', help: 3500, bag: 14, foodRate: 0.209, skillRate: 0.023, legend: false, exp: 1, candyName: 'ニャオハ', evolve: {before: 'ニャオハ', lv: 12, candy: 40, itemList: '', sleep: null }},
    { name: 'マスカーニャ', specialty: '食材', berry: 'ウイ', foodList: ['ほっこりポテト', 'モーモーミルク', 'あったかジンジャー'], skill: '料理パワーアップS', help: 2600, bag: 18, foodRate: 0.19, skillRate: 0.022, legend: false, exp: 1, candyName: 'ニャオハ', evolve: {before: 'ニャローテ', lv: 27, candy: 80, itemList: '', sleep: null }},
    { name: 'ホゲータ', specialty: '食材', berry: 'ヒメリ', foodList: ['とくせんリンゴ', 'マメミート', 'げきからハーブ'], skill: 'げんきチャージS', help: 4200, bag: 11, foodRate: 0.254, skillRate: 0.053, legend: false, exp: 1, candyName: 'ホゲータ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'アチゲータ', specialty: '食材', berry: 'ヒメリ', foodList: ['とくせんリンゴ', 'マメミート', 'げきからハーブ'], skill: 'げんきチャージS', help: 3100, bag: 16, foodRate: 0.247, skillRate: 0.05, legend: false, exp: 1, candyName: 'ホゲータ', evolve: {before: 'ホゲータ', lv: 12, candy: 40, itemList: '', sleep: null }},
    { name: 'ラウドボーン', specialty: '食材', berry: 'ブリー', foodList: ['とくせんリンゴ', 'マメミート', 'げきからハーブ'], skill: 'げんきチャージS', help: 2700, bag: 19, foodRate: 0.268, skillRate: 0.062, legend: false, exp: 1, candyName: 'ホゲータ', evolve: {before: 'アチゲータ', lv: 27, candy: 80, itemList: '', sleep: null }},
    { name: 'クワッス', specialty: '食材', berry: 'オレン', foodList: ['ワカクサ大豆', 'ふといながねぎ', 'ピュアなオイル'], skill: 'エナジーチャージM', help: 4800, bag: 10, foodRate: 0.261, skillRate: 0.028, legend: false, exp: 1, candyName: 'クワッス', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'ウェルカモ', specialty: '食材', berry: 'オレン', foodList: ['ワカクサ大豆', 'ふといながねぎ', 'ピュアなオイル'], skill: 'エナジーチャージM', help: 3600, bag: 14, foodRate: 0.259, skillRate: 0.027, legend: false, exp: 1, candyName: 'クワッス', evolve: {before: 'クワッス', lv: 12, candy: 40, itemList: '', sleep: null }},
    { name: 'ウェーニバル', specialty: '食材', berry: 'クラボ', foodList: ['ワカクサ大豆', 'ふといながねぎ', 'ピュアなオイル'], skill: 'エナジーチャージM', help: 2600, bag: 19, foodRate: 0.232, skillRate: 0.024, legend: false, exp: 1, candyName: 'クワッス', evolve: {before: 'ウェルカモ', lv: 27, candy: 80, itemList: '', sleep: null }},
    { name: 'パモ', specialty: 'スキル', berry: 'ウブ', foodList: ['リラックスカカオ', 'モーモーミルク', 'とくせんエッグ'], skill: 'げんきオールS', help: 4600, bag: 9, foodRate: 0.111, skillRate: 0.036, legend: false, exp: 1, candyName: 'パモ', evolve: {before: null, lv: null, candy: null, itemList: '', sleep: null }},
    { name: 'パモット', specialty: 'スキル', berry: 'ウブ', foodList: ['リラックスカカオ', 'モーモーミルク', 'とくせんエッグ'], skill: 'げんきオールS', help: 3300, bag: 12, foodRate: 0.109, skillRate: 0.036, legend: false, exp: 1, candyName: 'パモ', evolve: {before: 'パモ', lv: 14, candy: 40, itemList: '', sleep: null }},
    { name: 'パーモット', specialty: 'スキル', berry: 'ウブ', foodList: ['リラックスカカオ', 'モーモーミルク', 'とくせんエッグ'], skill: 'げんきオールS', help: 2400, bag: 18, foodRate: 0.141, skillRate: 0.039, legend: false, exp: 1, candyName: 'パモ', evolve: {before: 'パモット', lv: null, candy: 80, itemList: '', sleep: 150 }},
    { name: 'ドオー', specialty: '食材', berry: 'カゴ', foodList: ['リラックスカカオ', 'めざましコーヒー', 'ほっこりポテト'], skill: 'げんきチャージS', help: 3500, bag: 20, foodRate: 0.208, skillRate: 0.055, legend: false, exp: 1, candyName: 'ウパー', evolve: {before: 'ウパー(パルデアのすがた)', lv: 15, candy: 40, itemList: '', sleep: null }},
  ].map(x => {
    const foodNameList = x.foodList;
    const foodList = []
    const firstFoodEnergy = (Food.map[foodNameList[0]] as FoodType).energy * (x.specialty == '食材' || x.specialty == 'オール' ? 2 : 1)
    for(let i = 0; i < foodNameList.length; i++) {
      const food = Food.map[foodNameList[i]];
      foodList.push({
        name: food.name,
        numList: 
          [
            foodNameList.length > 3 || i <= 0 ? Math.round(firstFoodEnergy / food.energy) : null,
            foodNameList.length > 3 || i <= 1 ? Math.round(firstFoodEnergy * 2.25 / food.energy) : null,
            foodNameList.length > 3 || i <= 2 ? Math.round(firstFoodEnergy * 3.6 / food.energy) : null,
          ]
      })
    }

    const pokemon: PokemonType = {
      ...x,
      kaihou: x.name == 'ダークライ',
      skill: Skill.map[x.skill],
      berry: Berry.map[x.berry],
      type: Berry.map[x.berry].type,
      foodList,
      foodNameList,
      foodNumListMap: foodList.filter(x => x != null).reduce((a: { [key: string]: (number | null)[] }, x) => (a[x.name] = x.numList ?? [], a), {}),
      evolve: {
        ...x.evolve,
        itemList: x.evolve.itemList.split(','),
      },
      afterList: [],
    };
    if (pokemon.skill == null) throw `${pokemon.name}のスキルが誤っています(${x.skill})`
    return pokemon;
  })
  static nameSortList: PokemonType[];
  static map: {
    [key: string]: PokemonType;
  } = Pokemon.list.reduce((a: { [key: string]: PokemonType }, x) => (a[x.name] = x, a), {});
}

// 進化段階を計算
Pokemon.list.filter(x => x.evolve.before == null).forEach(x => {
  x.evolveLv = 1;
  x.remainEvolveLv = 0;
  x.evolveCandyMap = { [x.name]: 0 };
  x.requireSleep = { [x.name]: false };
})
Pokemon.list.filter(x => x.evolve.before != null && Pokemon.map[x.evolve.before].evolveLv && !x.evolveLv).forEach(x => {
  x.evolveLv = Pokemon.map[x.evolve.before].evolveLv + 1
  x.evolveCandyMap = { [x.name]: 0, [x.evolve.before]: x.evolve.candy }
  x.requireSleep = { [x.name]: false, [x.evolve.before]: !!x.evolve.sleep };
})
Pokemon.list.filter(x => x.evolve.before != null && Pokemon.map[x.evolve.before].evolveLv && !x.evolveLv).forEach(x => {
  const before = Pokemon.map[x.evolve.before];
  x.evolveLv = before.evolveLv + 1
  x.evolveCandyMap = { [x.name]: 0, [before.name]: x.evolve.candy, [before.evolve.before]: x.evolve.candy + before.evolve.candy }
  x.requireSleep = { [x.name]: false, [before.name]: !!x.evolve.sleep, [before.evolve.before]: !!x.evolve.sleep || !!before.evolve.sleep };
})

// 進化後を整理
for(let pokemon of Pokemon.list) {

  let targetList = [pokemon];

  if (pokemon.evolve.before == null) {
    pokemon.seed = pokemon.name;
  }

  let nestLv = 0;
  while(targetList.length) {
    let newTarget = [];
    for(let target of targetList) {
      // 自身の進化先を検索
      let afterList = Pokemon.list.filter(x => x.evolve.before == target.name);

      if (afterList.length) {
        // 進化元の名前を設定
        if (pokemon.evolve.before == null) {
          for(const after of afterList) {
            after.seed = pokemon.name;
          }
        }

        // 次の進化先を検索
        newTarget.push(...afterList);
      } else {
        pokemon.afterList.push(target.name)
        pokemon.remainEvolveLv = nestLv;
      }
    }
    targetList = newTarget;
    nestLv++;
  }
  pokemon.isLast = pokemon.afterList[0] == pokemon.name;
}

Pokemon.nameSortList = [...Pokemon.list].sort((a, b) => a.name < b.name ? -1 : 1)

export default Pokemon;