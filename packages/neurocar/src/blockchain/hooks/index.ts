"use client"

// Export hooks from individual files
export * from './useCarNFT';
export * from './useCarMarketplace';
export * from './useCarInsurance';
export * from './useRateOracle';
export * from './useERC20';
export * from './useUserCars';
export * from './useContractReads';

// You can also create convenient aliases or grouped exports here
import { useGetRate } from './useRateOracle';
import { useInsuranceDetails2 as useGetInsuranceDetails } from './useCarNFT';

// Rename any conflicting exports
export { useGetInsuranceDetails };

// Export convenient exchange rate hooks with preset values
export const useAvaxUsdtRate = () => useGetRate('AVAX_USDT');
export const useUsdtKesRate = () => useGetRate('USDT_KES');