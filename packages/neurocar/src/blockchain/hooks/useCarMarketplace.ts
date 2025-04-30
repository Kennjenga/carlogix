import { useState, useEffect, useMemo } from 'react';
import { type Address, type Hash, type Abi } from 'viem';
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContract, useReadContracts } from 'wagmi'; // Import useReadContracts
import { carmarketplace_abi, carmarketplace_address, carnft_abi, carnft_address, usdt_abi, usdt_address } from '@/blockchain/abi/neuro';
import { useContractRead as useAppContractRead } from './useContractReads'; // Renamed to avoid conflict
import { CarDetails as CarNFTDetailsType } from '@/types'; // Import the detailed type

// --- Types ---
interface BaseTxnProps {
    onSuccess?: (hash: Hash) => void;
    onError?: (error: Error) => void;
}

interface UseListCarProps extends BaseTxnProps {
    tokenId: bigint;
    price: bigint;
    description: string;
}

interface UsePurchaseCarProps extends BaseTxnProps {
    tokenId: bigint;
}

interface UseCancelListingProps extends BaseTxnProps {
    tokenId: bigint;
}

// Define a more specific CarDetails type matching the contract return if not already defined elsewhere
// interface CarContractDetails {
//     vin: string;
//     make: string;
//     model: string;
//     year: bigint;
//     registrationNumber: string;
//     imageURI: string;
//     createdAt: bigint;
//     isDeleted: boolean;
//     // Add other fields returned by the contract's getCarDetails function
// }

// Updated Listing interface to include detailed car info
export interface Listing {
  tokenId: bigint;
  price: bigint;
  seller: Address;
  carDetails: CarNFTDetailsType | null; // Use the imported detailed type
  listedAt: bigint; // This might still need fetching separately if not returned by getActiveListings
  isActive: boolean; // This might still need fetching separately
}


// --- Hook for Listing a Car ---
export function useListCar() {
    const { address: connectedAddress } = useAccount();
    const [isListing, setIsListing] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const { data: hash, writeContract, reset } = useWriteContract();
    const [listProps, setListProps] = useState<UseListCarProps | null>(null);

    // Read ownerOf from CarNFT
    const { data: ownerOfTokenData, refetch: refetchOwnerOf, isLoading: isLoadingOwner } = useReadContract({
        address: carnft_address as Address,
        abi: carnft_abi,
        functionName: 'ownerOf',
        args: listProps?.tokenId ? [listProps.tokenId] : undefined,
        query: { enabled: !!listProps?.tokenId && !!connectedAddress }
    });
    const ownerOfToken = ownerOfTokenData as Address | undefined;

    // Read getApproved from CarNFT
    const { data: approvedAddressData, refetch: refetchApproved, isLoading: isLoadingApproved } = useReadContract({
        address: carnft_address as Address,
        abi: carnft_abi,
        functionName: 'getApproved',
        args: listProps?.tokenId ? [listProps.tokenId] : undefined,
        query: { enabled: !!listProps?.tokenId && !!connectedAddress }
    });
    const approvedAddress = approvedAddressData as Address | undefined;

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({ hash });

    const listCar = async (props: UseListCarProps) => {
        reset(); // Reset previous transaction state
        if (!connectedAddress) {
            const err = new Error('Wallet not connected');
            setError(err);
            if (props.onError) props.onError(err);
            return;
        }
        setIsListing(true);
        setError(null);
        setListProps(props); // Store props for use in effect

        // Trigger refetches - the effect will handle the rest
        try {
            await Promise.all([refetchOwnerOf(), refetchApproved()]);
        } catch (readError) {
            console.error('Failed to trigger NFT status refetch:', readError);
            // Error handled in the effect based on loading/data status
        }
    };

    // Effect to perform checks and list after data is fetched
    useEffect(() => {
        if (!isListing || !listProps || isLoadingOwner || isLoadingApproved || ownerOfToken === undefined || approvedAddress === undefined) {
            // Still loading checks, waiting for data, or not in listing process
            // Note: approvedAddress can legitimately be the zero address if not set, handle this.
            return;
        }

        // Check 1: Ownership
        if (ownerOfToken.toLowerCase() !== connectedAddress?.toLowerCase()) {
            const err = new Error(`You do not own NFT with ID ${listProps.tokenId}. Owner: ${ownerOfToken}`);
            setError(err);
            setIsListing(false);
            if (listProps.onError) listProps.onError(err);
            setListProps(null);
            return;
        }

        // Check 2: Marketplace Approval
        // Ensure case-insensitive comparison for addresses
        if (approvedAddress.toLowerCase() !== carmarketplace_address.toLowerCase()) {
            const err = new Error(`Marketplace (${carmarketplace_address}) not approved for NFT ID ${listProps.tokenId}. Approved: ${approvedAddress}. Please approve the marketplace first.`);
            setError(err);
            setIsListing(false);
            if (listProps.onError) listProps.onError(err);
            setListProps(null);
            // TODO: Optionally, trigger the approval flow here
            return;
        }

        // If checks pass, proceed with the writeContract call
        try {
            writeContract({
                address: carmarketplace_address as Address,
                abi: carmarketplace_abi,
                functionName: 'listCar',
                args: [listProps.tokenId, listProps.price, listProps.description],
            }, {
                onSuccess: (txHash) => {
                    console.log('List car transaction sent:', txHash);
                    if (listProps.onSuccess) listProps.onSuccess(txHash);
                    // isListing will be set to false by the confirmation effect
                },
                onError: (err) => {
                    console.error('List car write error:', err);
                    setError(err);
                    setIsListing(false);
                    if (listProps.onError) listProps.onError(err);
                    setListProps(null);
                },
            });
        } catch (err) {
            console.error('Failed to initiate list car transaction:', err);
            const error = err instanceof Error ? err : new Error('An unknown error occurred during listing initiation');
            setError(error);
            setIsListing(false);
            if (listProps.onError) listProps.onError(error);
            setListProps(null);
        }

    }, [isListing, listProps, ownerOfToken, approvedAddress, isLoadingOwner, isLoadingApproved, connectedAddress, writeContract, refetchOwnerOf, refetchApproved]);

    // Reset isListing state when transaction is confirmed or if there was an initial error
    useEffect(() => {
        if (isConfirmed || (error && !hash)) { // Reset if confirmed or if error occurred *before* sending tx
            setIsListing(false);
            setListProps(null); // Clean up props
        }
    }, [isConfirmed, error, hash]);


    const clearError = () => setError(null);

    return {
        listCar,
        isListing: isListing || isConfirming, // Combined loading state
        isConfirming,
        isConfirmed,
        hash,
        error,
        clearError
    };
}


// --- Hook for Purchasing a Car ---
export function usePurchaseCar() {
    const { address: connectedAddress } = useAccount();
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const { data: hash, writeContract, reset } = useWriteContract();
    const [purchaseProps, setPurchaseProps] = useState<UsePurchaseCarProps | null>(null);

    // Read listing details to get the price
    const { data: listingDetailsData, refetch: refetchListingDetails, isLoading: isLoadingListing } = useAppContractRead<[bigint, boolean, bigint, string]>({
        address: carmarketplace_address as Address,
        abi: carmarketplace_abi as Abi,
        functionName: 'getListingDetails',
        args: purchaseProps?.tokenId ? [purchaseProps.tokenId] : undefined,
        enabled: !!purchaseProps?.tokenId,
    });
    const listingDetails = useMemo(() => {
        return listingDetailsData ? {
            price: listingDetailsData[0],
            isActive: listingDetailsData[1],
            listedAt: listingDetailsData[2],
            description: listingDetailsData[3],
        } : undefined;
    }, [listingDetailsData]);
    const price = listingDetails?.price;

    // Read USDT balance
    const { data: usdtBalanceData, refetch: refetchBalance, isLoading: isLoadingBalance } = useReadContract({
        address: usdt_address as Address,
        abi: usdt_abi,
        functionName: 'balanceOf',
        args: connectedAddress ? [connectedAddress] : undefined,
        query: { enabled: !!connectedAddress && price !== undefined && !!purchaseProps }
    });
    const usdtBalance = typeof usdtBalanceData === 'bigint' ? usdtBalanceData : undefined;

    // Read USDT allowance for the marketplace
    const { data: usdtAllowanceData, refetch: refetchAllowance, isLoading: isLoadingAllowance } = useReadContract({
        address: usdt_address as Address,
        abi: usdt_abi,
        functionName: 'allowance',
        args: connectedAddress ? [connectedAddress, carmarketplace_address as Address] : undefined,
        query: { enabled: !!connectedAddress && price !== undefined && !!purchaseProps }
    });
    const usdtAllowance = typeof usdtAllowanceData === 'bigint' ? usdtAllowanceData : undefined;


    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({ hash });

    const purchaseCar = async (props: UsePurchaseCarProps) => {
        reset(); // Reset previous transaction state
        if (!connectedAddress) {
            const err = new Error('Wallet not connected');
            setError(err);
            if (props.onError) props.onError(err);
            return;
        }
        setIsPurchasing(true);
        setError(null);
        setPurchaseProps(props); // Store props for use in effect

        // Trigger refetches - the effect will handle the rest
        try {
            // Ensure listing details are fetched first to get the price
            await refetchListingDetails();
            // Balance/Allowance refetches are triggered by enabled flag based on price
        } catch (readError) {
            console.error('Failed to trigger purchase pre-requisites refetch:', readError);
             // Error handled in the effect based on loading/data status
        }
    };

     // Effect to perform checks and purchase after data is fetched
    useEffect(() => {
        if (!isPurchasing || !purchaseProps || isLoadingListing || isLoadingBalance || isLoadingAllowance || price === undefined || usdtBalance === undefined || usdtAllowance === undefined) {
             // Still loading checks, waiting for data, or not in purchasing process
            return;
        }

        // Check 0: Is listing active?
        if (!listingDetails?.isActive) {
             const err = new Error(`Listing for NFT ID ${purchaseProps.tokenId} is not active.`);
            setError(err);
            setIsPurchasing(false);
            if (purchaseProps.onError) purchaseProps.onError(err);
            setPurchaseProps(null);
            return;
        }


        // Check 1: Sufficient USDT Balance
        if (usdtBalance < price) {
            const err = new Error(`Insufficient USDT balance. Price: ${price.toString()}, Balance: ${usdtBalance.toString()}`);
            setError(err);
            setIsPurchasing(false);
            if (purchaseProps.onError) purchaseProps.onError(err);
            setPurchaseProps(null);
            return;
        }

        // Check 2: Sufficient USDT Allowance for Marketplace
        if (usdtAllowance < price) {
            const err = new Error(`Insufficient USDT allowance for marketplace. Required: ${price.toString()}, Allowance: ${usdtAllowance.toString()}. Please approve USDT spending.`);
            setError(err);
            setIsPurchasing(false);
            if (purchaseProps.onError) purchaseProps.onError(err);
            setPurchaseProps(null);
            // TODO: Optionally, trigger the USDT approval flow here
            return;
        }

        // If checks pass, proceed with the writeContract call
        try {
            writeContract({
                address: carmarketplace_address as Address,
                abi: carmarketplace_abi,
                functionName: 'purchaseCar',
                args: [purchaseProps.tokenId],
            }, {
                onSuccess: (txHash) => {
                    console.log('Purchase car transaction sent:', txHash);
                    if (purchaseProps.onSuccess) purchaseProps.onSuccess(txHash);
                     // isPurchasing will be set to false by the confirmation effect
                },
                onError: (err) => {
                    console.error('Purchase car write error:', err);
                    setError(err);
                    setIsPurchasing(false);
                    if (purchaseProps.onError) purchaseProps.onError(err);
                    setPurchaseProps(null);
                },
            });
        } catch (err) {
            console.error('Failed to initiate purchase car transaction:', err);
            const error = err instanceof Error ? err : new Error('An unknown error occurred during purchase initiation');
            setError(error);
            setIsPurchasing(false);
            if (purchaseProps.onError) purchaseProps.onError(error);
            setPurchaseProps(null);
        }

    }, [isPurchasing, purchaseProps, price, listingDetails, usdtBalance, usdtAllowance, isLoadingListing, isLoadingBalance, isLoadingAllowance, connectedAddress, writeContract, refetchListingDetails, refetchBalance, refetchAllowance]);


    // Reset isPurchasing state when transaction is confirmed or fails
     useEffect(() => {
        if (isConfirmed || (error && !hash)) { // Reset if confirmed or if error occurred *before* sending tx
            setIsPurchasing(false);
            setPurchaseProps(null); // Clean up props
        }
    }, [isConfirmed, error, hash]);


    const clearError = () => setError(null);

    return {
        purchaseCar,
        isPurchasing: isPurchasing || isConfirming, // Combined loading state
        isConfirming,
        isConfirmed,
        hash,
        error,
        clearError
    };
}

// --- Hook for Cancelling a Listing ---
export function useCancelListing() {
  const { address: connectedAddress } = useAccount();
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { data: hash, writeContract, reset } = useWriteContract();
  const [cancelProps, setCancelProps] = useState<UseCancelListingProps | null>(null);

  // Read listing details to check seller
  const { data: listingDetailsData, refetch: refetchListingDetails, isLoading: isLoadingListing } = useAppContractRead<[bigint, boolean, bigint, string]>({
      address: carmarketplace_address as Address,
      abi: carmarketplace_abi as Abi,
      functionName: 'getListingDetails',
      args: cancelProps?.tokenId ? [cancelProps.tokenId] : undefined,
      enabled: !!cancelProps?.tokenId,
  });
   const listingDetails = useMemo(() => listingDetailsData ? {
        price: listingDetailsData[0],
        isActive: listingDetailsData[1],
        listedAt: listingDetailsData[2],
        description: listingDetailsData[3],
    } : undefined, [listingDetailsData]);

  // Read ownerOf from CarNFT (needed to determine the actual seller in the contract)
  const { data: ownerOfTokenData, refetch: refetchOwnerOf, isLoading: isLoadingOwner } = useReadContract({
        address: carnft_address as Address,
        abi: carnft_abi,
        functionName: 'ownerOf',
        args: cancelProps?.tokenId ? [cancelProps.tokenId] : undefined,
        query: { enabled: !!cancelProps?.tokenId && !!connectedAddress }
    });
    const ownerOfToken = ownerOfTokenData as Address | undefined;


  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const cancelListing = async (props: UseCancelListingProps) => {
    reset(); // Reset previous transaction state
    if (!connectedAddress) {
        const err = new Error('Wallet not connected');
        setError(err);
        if (props.onError) props.onError(err);
        return;
    }
    setIsCancelling(true);
    setError(null);
    setCancelProps(props);

    // Trigger refetches
     try {
        await Promise.all([refetchListingDetails(), refetchOwnerOf()]);
    } catch (readError) {
        console.error('Failed to trigger cancel pre-requisites refetch:', readError);
        // Error handled in the effect
    }
  };

  // Effect to perform checks and cancel after data is fetched
  useEffect(() => {
    if (!isCancelling || !cancelProps || isLoadingListing || isLoadingOwner || listingDetails === undefined || ownerOfToken === undefined) {
        // Still loading checks, waiting for data, or not in cancelling process
        return;
    }

    // Check 1: Is listing active?
    if (!listingDetails?.isActive) {
        const err = new Error(`Listing for NFT ID ${cancelProps.tokenId} is not active or does not exist.`);
        setError(err);
        setIsCancelling(false);
        if (cancelProps.onError) cancelProps.onError(err);
        setCancelProps(null);
        return;
    }

    // Check 2: Is the connected user the owner/seller?
    if (ownerOfToken.toLowerCase() !== connectedAddress?.toLowerCase()) {
        const err = new Error(`You are not the current owner of NFT ID ${cancelProps.tokenId}. Cannot cancel listing.`);
        setError(err);
        setIsCancelling(false);
        if (cancelProps.onError) cancelProps.onError(err);
        setCancelProps(null);
        return;
    }

    // If checks pass, proceed with the writeContract call
    try {
        writeContract({
            address: carmarketplace_address as Address,
            abi: carmarketplace_abi,
            functionName: 'cancelListing',
            args: [cancelProps.tokenId],
        }, {
            onSuccess: (txHash) => {
                console.log('Cancel listing transaction sent:', txHash);
                if (cancelProps.onSuccess) cancelProps.onSuccess(txHash);
                 // isCancelling will be set to false by the confirmation effect
            },
            onError: (err) => {
                console.error('Cancel listing write error:', err);
                setError(err);
                setIsCancelling(false);
                if (cancelProps.onError) cancelProps.onError(err);
                setCancelProps(null);
            },
        });
    } catch (err) {
        console.error('Failed to initiate cancel listing transaction:', err);
        const error = err instanceof Error ? err : new Error('An unknown error occurred during cancellation initiation');
        setError(error);
        setIsCancelling(false);
        if (cancelProps.onError) cancelProps.onError(error);
        setCancelProps(null);
    }

  }, [isCancelling, cancelProps, listingDetails, ownerOfToken, isLoadingListing, isLoadingOwner, connectedAddress, writeContract, refetchListingDetails, refetchOwnerOf]);


  // Reset isCancelling state when transaction is confirmed or fails
  useEffect(() => {
    if (isConfirmed || (error && !hash)) { // Reset if confirmed or if error occurred *before* sending tx
        setIsCancelling(false);
        setCancelProps(null); // Clean up props
    }
  }, [isConfirmed, error, hash]);

  const clearError = () => setError(null);

  return {
    cancelListing,
    isCancelling: isCancelling || isConfirming,
    isConfirming,
    isConfirmed,
    hash,
    error,
    clearError
  };
}


// --- Read hooks ---

// Get Active Listings (Enhanced with Car Details)
export function useActiveListings(startIndex: bigint = BigInt(0), count: bigint = BigInt(10)) {
  // Fetch basic listing info (tokenIds, prices, sellers)
  const {
    data: basicListingsData,
    error: basicListingsError,
    isLoading: isLoadingBasicListings,
    refetch: refetchBasicListings,
  } = useAppContractRead<[bigint[], bigint[], Address[]]>({
    address: carmarketplace_address as Address,
    abi: carmarketplace_abi as Abi,
    functionName: 'getActiveListings',
    args: [startIndex, count],
    // watch: true, // Enable if real-time updates are needed
  });

  const tokenIds = useMemo(() => basicListingsData?.[0] ?? [], [basicListingsData]);

  // Prepare contracts array for fetching details for each tokenId
  const carDetailsContracts = useMemo(() => tokenIds.map(tokenId => ({
    address: carnft_address as Address,
    abi: carnft_abi as Abi,
    functionName: 'getCarDetails',
    args: [tokenId],
  })), [tokenIds]);

  // Fetch car details in batch
  const {
    data: carDetailsResults,
    error: carDetailsError,
    isLoading: isLoadingCarDetails,
    refetch: refetchCarDetails,
  } = useReadContracts({
    contracts: carDetailsContracts,
    query: {
      enabled: tokenIds.length > 0, // Only run if there are token IDs
    }
  });

  // Combine basic listing info with fetched car details
  const listings = useMemo(() => {
    if (!basicListingsData || !carDetailsResults) return [];

    const [ids, prices, sellers] = basicListingsData;

    return ids.map((tokenId, index) => {
      const detailsResult = carDetailsResults[index];
      let carDetails: CarNFTDetailsType | null = null;

      if (detailsResult?.status === 'success') {
        // Assuming the contract returns an object/struct directly
        // Adjust the casting based on the actual structure returned by useReadContracts and your contract
         carDetails = detailsResult.result as CarNFTDetailsType;
         // If result is an array, map it to the CarNFTDetailsType object
         // Example: if result = [vin, make, model, year, ...]
         // carDetails = { vin: result[0], make: result[1], model: result[2], year: result[3], ... };
      } else if (detailsResult?.status === 'failure') { // Changed 'error' to 'failure'
        // Error is accessible when status is 'failure'
        console.error(`Error fetching details for token ${tokenId}:`, detailsResult.error);
      }

      // TODO: Fetch listedAt and isActive if needed, potentially with another useReadContracts call
      // to getListingDetails for each token ID. This adds complexity and network requests.
      // Consider if getActiveListings can be modified in the contract to return more data.

      return {
        tokenId,
        price: prices[index],
        seller: sellers[index],
        carDetails: carDetails,
        listedAt: BigInt(0), // Placeholder - fetch if needed
        isActive: true, // Assume active as it came from getActiveListings - fetch if needed
      };
    });
  }, [basicListingsData, carDetailsResults]);

  const isLoading = isLoadingBasicListings || (tokenIds.length > 0 && isLoadingCarDetails);
  // Combine errors carefully
  const error = basicListingsError || (carDetailsResults?.some(r => r.status === 'failure') ? new Error("Failed to fetch some car details") : null) || carDetailsError;

  const refetch = async () => {
    // Refetch both basic listings and details
    await refetchBasicListings();
    if (tokenIds.length > 0) {
      await refetchCarDetails();
    }
  };

  return { listings, error, isLoading, refetch };
}


// Get Listing Details
interface ListingDetailsReturn {
  price: bigint;
  isActive: boolean;
  listedAt: bigint;
  description: string;
}

export function useListingDetails(tokenId?: bigint) {
  const { data, error, isLoading, refetch } = useAppContractRead<[bigint, boolean, bigint, string]>({
    address: carmarketplace_address as Address,
    abi: carmarketplace_abi as Abi,
    functionName: 'getListingDetails',
    args: tokenId ? [tokenId] : undefined,
    enabled: !!tokenId, // Only run query if tokenId is provided
    // Add watch: true to automatically refetch on block changes if desired
    // watch: true,
  });

   // Process data into a more usable object
   const details: ListingDetailsReturn | undefined = data ? {
    price: data[0],
    isActive: data[1],
    listedAt: data[2], // This is a BigInt timestamp
    description: data[3],
  } : undefined;


  return { details, error, isLoading, refetch };
}

// --- Helper hook for NFT Approval (Optional but recommended) ---
export function useApproveMarketplace(tokenId?: bigint) {
    const { address: connectedAddress } = useAccount();
    const [isApproving, setIsApproving] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const { data: hash, writeContract, reset } = useWriteContract();

     // Read getApproved from CarNFT to see if approval is needed
    const { data: approvedAddressData, refetch: refetchApproved, isLoading: isLoadingApproved } = useReadContract({
        address: carnft_address as Address,
        abi: carnft_abi,
        functionName: 'getApproved',
        args: tokenId ? [tokenId] : undefined,
        query: { enabled: !!tokenId && !!connectedAddress }
    });
    const approvedAddress = approvedAddressData as Address | undefined;

    const needsApproval = !!tokenId && !!connectedAddress && !isLoadingApproved && approvedAddress?.toLowerCase() !== carmarketplace_address.toLowerCase();

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({ hash });

    const approveMarketplace = async () => {
        reset();
        if (!connectedAddress) {
            setError(new Error('Wallet not connected'));
            return;
        }
        if (!tokenId) {
            setError(new Error('Token ID not specified for approval'));
            return;
        }
        if (!needsApproval) {
            console.log("Approval not needed or already granted.");
            // Optionally call onSuccess directly if already approved
            return;
        }

        setIsApproving(true);
        setError(null);

        try {
            writeContract({
                address: carnft_address as Address,
                abi: carnft_abi,
                functionName: 'approve',
                args: [carmarketplace_address as Address, tokenId],
            }, {
                onSuccess: (txHash) => {
                    console.log('Approve marketplace transaction sent:', txHash);
                    // Refetch approval status after confirmation
                },
                onError: (err) => {
                    console.error('Approve marketplace write error:', err);
                    setError(err);
                    setIsApproving(false);
                },
            });
        } catch (err) {
            console.error('Failed to initiate approve marketplace transaction:', err);
            const error = err instanceof Error ? err : new Error('An unknown error occurred during approval initiation');
            setError(error);
            setIsApproving(false);
        }
    };

     // Effect to refetch approval status after confirmation
    useEffect(() => {
        if (isConfirmed) {
            refetchApproved();
            setIsApproving(false);
        }
         if (error && !hash) { // Reset if error occurred before sending tx
            setIsApproving(false);
        }
    }, [isConfirmed, error, hash, refetchApproved]);

    const clearError = () => setError(null);

    return {
        approveMarketplace,
        needsApproval,
        isApproving: isApproving || isConfirming,
        isConfirmingApproval: isConfirming,
        isApproved: isConfirmed, // Indicates the *approval transaction* succeeded
        approvalHash: hash,
        approvalError: error,
        clearApprovalError: clearError,
        isLoadingApprovalStatus: isLoadingApproved,
    };
}

// --- Helper hook for USDT Approval (Optional but recommended) ---
export function useApproveUsdt(amount?: bigint) {
    const { address: connectedAddress } = useAccount();
    const [isApproving, setIsApproving] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const { data: hash, writeContract, reset } = useWriteContract();

    // Read USDT allowance for the marketplace
    const { data: currentAllowanceData, refetch: refetchAllowance, isLoading: isLoadingAllowance } = useReadContract({
        address: usdt_address as Address,
        abi: usdt_abi,
        functionName: 'allowance',
        args: connectedAddress ? [connectedAddress, carmarketplace_address as Address] : undefined,
        query: { enabled: !!connectedAddress && amount !== undefined }
    });
    const currentAllowance = typeof currentAllowanceData === 'bigint' ? currentAllowanceData : undefined;

    const needsApproval = !!connectedAddress && amount !== undefined && !isLoadingAllowance && (currentAllowance === undefined || currentAllowance < amount);

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({ hash });

    const approveUsdt = async () => {
        reset();
        if (!connectedAddress) {
            setError(new Error('Wallet not connected'));
            return;
        }
        if (amount === undefined) {
             setError(new Error('Amount not specified for USDT approval'));
            return;
        }
         if (!needsApproval) {
            console.log("USDT approval not needed or already sufficient.");
            // Optionally call onSuccess directly
            return;
        }

        setIsApproving(true);
        setError(null);

        try {
            writeContract({
                address: usdt_address as Address,
                abi: usdt_abi,
                functionName: 'approve',
                args: [carmarketplace_address as Address, amount], // Approve the specific amount needed
            }, {
                onSuccess: (txHash) => {
                    console.log('Approve USDT transaction sent:', txHash);
                     // Refetch allowance status after confirmation
                },
                onError: (err) => {
                    console.error('Approve USDT write error:', err);
                    setError(err);
                    setIsApproving(false);
                },
            });
        } catch (err) {
            console.error('Failed to initiate approve USDT transaction:', err);
            const error = err instanceof Error ? err : new Error('An unknown error occurred during USDT approval initiation');
            setError(error);
            setIsApproving(false);
        }
    };

     // Effect to refetch allowance status after confirmation
    useEffect(() => {
        if (isConfirmed) {
            refetchAllowance();
            setIsApproving(false);
        }
         if (error && !hash) { // Reset if error occurred before sending tx
            setIsApproving(false);
        }
    }, [isConfirmed, error, hash, refetchAllowance]);


    const clearError = () => setError(null);

    return {
        approveUsdt,
        needsApproval,
        isApproving: isApproving || isConfirming,
        isConfirmingApproval: isConfirming,
        isApproved: isConfirmed, // Indicates the *approval transaction* succeeded
        approvalHash: hash,
        approvalError: error,
        clearApprovalError: clearError,
        isLoadingAllowanceStatus: isLoadingAllowance,
        currentAllowance,
    };
}
