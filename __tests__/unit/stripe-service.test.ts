import { stripeService } from '@/services/payment/stripe-service'
import { stripe } from '@/services/payment/stripe-service'

jest.mock('@/services/payment/stripe-service', () => {
  const mockStripe = {
    paymentIntents: {
      create: jest.fn(),
      confirm: jest.fn(),
      retrieve: jest.fn(),
    },
    customers: {
      create: jest.fn(),
      list: jest.fn(),
    },
    refunds: {
      create: jest.fn(),
    },
    paymentMethods: {
      list: jest.fn(),
    },
  }

  return {
    stripe: mockStripe,
    stripeService: {
      createPaymentIntent: jest.fn(),
      confirmPaymentIntent: jest.fn(),
      getPaymentIntent: jest.fn(),
      getOrCreateCustomer: jest.fn(),
      createRefund: jest.fn(),
      listPaymentMethods: jest.fn(),
    },
  }
})

describe('stripeService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createPaymentIntent', () => {
    it('should have createPaymentIntent method', () => {
      expect(stripeService.createPaymentIntent).toBeDefined()
    })
  })

  describe('confirmPaymentIntent', () => {
    it('should have confirmPaymentIntent method', () => {
      expect(stripeService.confirmPaymentIntent).toBeDefined()
    })
  })

  describe('getPaymentIntent', () => {
    it('should have getPaymentIntent method', () => {
      expect(stripeService.getPaymentIntent).toBeDefined()
    })
  })

  describe('getOrCreateCustomer', () => {
    it('should have getOrCreateCustomer method', () => {
      expect(stripeService.getOrCreateCustomer).toBeDefined()
    })
  })

  describe('createRefund', () => {
    it('should have createRefund method', () => {
      expect(stripeService.createRefund).toBeDefined()
    })
  })

  describe('listPaymentMethods', () => {
    it('should have listPaymentMethods method', () => {
      expect(stripeService.listPaymentMethods).toBeDefined()
    })
  })
})

