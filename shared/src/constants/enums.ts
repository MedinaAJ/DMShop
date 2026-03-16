export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
  EMPLOYEE = 'employee',
}

export enum OrderStateId {
  AWAITING_PAYMENT = 1,
  PAYMENT_ACCEPTED = 2,
  PROCESSING = 3,
  SHIPPED = 4,
  DELIVERED = 5,
  CANCELLED = 6,
  REFUNDED = 7,
  PAYMENT_ERROR = 8,
  ON_HOLD = 9,
}

export enum ShippingMethod {
  PRICE = 'price',
  WEIGHT = 'weight',
}

export enum ReductionType {
  PERCENTAGE = 'percentage',
  AMOUNT = 'amount',
}

export enum HookName {
  BEFORE_ADD_TO_CART = 'beforeAddToCart',
  AFTER_ADD_TO_CART = 'afterAddToCart',
  BEFORE_CREATE_ORDER = 'beforeCreateOrder',
  AFTER_CREATE_ORDER = 'afterCreateOrder',
  BEFORE_PAYMENT = 'beforePayment',
  AFTER_PAYMENT = 'afterPayment',
  BEFORE_UPDATE_CART = 'beforeUpdateCart',
  AFTER_UPDATE_CART = 'afterUpdateCart',
  ON_PRODUCT_VIEW = 'onProductView',
  ON_SEARCH = 'onSearch',
  ON_USER_LOGIN = 'onUserLogin',
  ON_USER_REGISTER = 'onUserRegister',
}
