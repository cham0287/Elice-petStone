import {redirectMain} from '/permission.js';
import * as Api from '/api.js';
import store from '../cart/store.js';
import { addCommas, searchAddressByDaumPost } from '/useful-functions.js';
import { navTemplate } from '/common/nav.js';

/* nav Template */
function addNav() {
	const header = document.querySelector('.headerNav');
	header.innerHTML = navTemplate();
}
addNav();

const storedItem =
location.search?
  [ JSON.parse( sessionStorage.getItem('product'))]
  :
  store
  .getLocalStorage()
  .filter((item) => item.cart === 'checked');
console.log(storedItem);
if(storedItem.length < 1){
  alert("상품을 선택해주세요.");
  redirectMain();
}
//user Inputs
const receiverNameInput = document.getElementById('receiverNameInput');
const receiverPhoneNumberInput = document.getElementById(
  'receiverPhoneNumberInput'
);
const postalCodeInput = document.getElementById('postalCodeInput');
const address1Input = document.getElementById('address1Input');
const address2Input = document.getElementById('address2Input');
const customRequestInput = document.getElementById('customRequestInput');
const requestSelectBox = document.getElementById('requestSelectBox');
const searchAddressButton = document.getElementById('searchAddressButton');

//product summary
const productsTitle = document.getElementById('productsTitle');
const productsTotal = document.getElementById('productsTotal');
const deliveryFee = document.getElementById('deliveryFee');
const orderTotal = document.getElementById('orderTotal');

// send Data
const checkoutButton = document.getElementById('checkoutButton');

addAllElements();
addAllEvents();

async function addAllElements() {
  insertOrderSummary();
}

async function addAllEvents() {
  searchAddressButton.addEventListener('click', insertAddressToAddrInputs);
  checkoutButton.addEventListener('click', sendOrderInfoByPost);
  requestSelectBox.addEventListener('change', changeRequestBox);
}

function changeRequestBox(e) {
  const selectedItem = e.target.value;
  if (selectedItem === '6') {
    customRequestInput.classList.remove('is-hidden');
  } else {
    customRequestInput.classList.add('is-hidden');
  }
}

// address Inputs에 다음 API를 사용한 값을 넣습니다.
async function insertAddressToAddrInputs() {
  const { zonecode, address } = await searchAddressByDaumPost();
  postalCodeInput.value = zonecode;
  address1Input.value = address;
  address2Input.focus();
}

function insertOrderSummary() {
  if (!storedItem || storedItem.length < 1) return;
  console.log(storedItem);
  let amount = 0;
  let Fee = 3000;

  globalThis.products = storedItem.map(({ _id, name, price, count }) => {
    amount += price * count;
    return {
      _id,
      name,
      price,
      count,
      totalPrice: price * count,
      title: `${name} / ${count}개`,
    };
  });
  console.log('products', products, 'amount', amount);
  productsTitle.innerHTML = products.map(({ title }) => title).join('<br>');
  productsTotal.textContent = addCommas(amount) + '원';
  deliveryFee.textContent = addCommas(Fee) + '원';
  orderTotal.textContent = addCommas(Fee + amount) + '원';
}

/**
 * Author : Park Award
 * create At: 22-06-01
 * @param {Event} e 
 * @returns 
 * 주문 관련된 데이터를 서버 저장합니다.
 */
async function sendOrderInfoByPost(e) {
  e.preventDefault();
  const receiverName = receiverNameInput.value;
  const receiverPhoneNumber = receiverPhoneNumberInput.value;
  const postalCode = postalCodeInput.value;
  const address1 = address1Input.value;
  const address2 = address2Input.value;
  const requestSelect = requestSelectBox.value;
  let requestComment = '';

  const receiverNameValid = (/^[가-힣a-zA-Z]+$/).exec(receiverName);
  const receiverPhoneNumberValid = receiverPhoneNumber.length > 7 && 	
  (/^[0-9]+$/).exec(receiverPhoneNumber);
  const addressValid = postalCode && address1 && address2;

  if (!receiverNameValid) {
    return alert('받는 분 이름을 입력해주세요.');
  }
  if (!receiverPhoneNumberValid) {
    return alert('받는 분 연락처를 적어주세요.');
  }
  if (!addressValid) {
    return alert('배송지를 입력해주세요.');
  }

  switch (requestSelect) {
    case '0':
      return alert('요청 사항을 선택해주세요');
    case '1':
      requestComment = '직접 수령하겠습니다.';
      break;
    case '2':
      requestComment = '배송 전 연락바랍니다.';
      break;
    case '3':
      requestComment = '부재 시 경비실에 맡겨주세요.';
      break;
    case '4':
      requestComment = '부재 시 문 앞에 놓아주세요.';
      break;
    case '5':
      requestComment = '부재 시 택배함에 넣어주세요';
      break;
    case '6':
      requestComment = customRequestInput.value;
      break;
  }

  const products = [];
  globalThis.products.forEach(({ _id, count, totalPrice }) =>
    products.push({
      product_id: _id,
      qty: count,
      totalPrice,
    })
  );
  const orderInfo = {
    fullNameTo: receiverName,
    phoneNumberTo: receiverPhoneNumber,
    addressTo: {
      postalCode,
      address1,
      address2,
    },
    messageTo: requestComment,
    products,
  };
  console.log(orderInfo);
  try {
    const result = await Api.post('/api/orders', orderInfo);
    if (result) {
      if(location.search){
        sessionStorage.setItem('Product','');
      }else{
        localStorage.clear();
      }
      window.location.href="/complete";
      return alert('성공적으로 주문했습니다.');
    }
  } catch (err) {
    alert(`문제가 발생하였습니다. 확인 후 다시 시도해 주세요: ${err.message}`);
  }
}
