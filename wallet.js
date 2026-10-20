
/* =================================
   EarnFlex NG - Wallet Dashboard
   ================================= */

const SUPABASE_URL =
  "https://avedaeoxwtfhfbwylpun.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_pst3lvOpzJFEZuJIJtvHmg_LFwvn6Ln";

// Connect to Supabase
const walletSupabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const walletFormat = (amount) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2
  }).format(Number(amount) || 0);

function walletMessage(message) {
  const element = document.getElementById("wallet-message");
  if (element) element.textContent = message;
}

async function loadWallet() {
  walletMessage("Loading your wallet...");

  try {
    // Check the current login session
    const { data: authData, error: authError } =
      await walletSupabase.auth.getUser();

    if (authError || !authData.user) {
      walletMessage("Please log in to view your wallet.");
      return;
    }

    const user = authData.user;

    // Read this user's wallet profile
    const { data: profile, error: profileError } =
      await walletSupabase
        .from("profiles")
        .select("balance, total_earnings")
        .eq("id", user.id)
        .single();

    if (profileError) {
      throw new Error(
        "Wallet profile unavailable. Check your profiles table and access policies."
      );
    }

    const balance = Number(profile.balance) || 0;
    const earnings = Number(profile.total_earnings) || 0;

    const balanceElement =
      document.getElementById("wallet-balance");

    const earningsElement =
      document.getElementById("total-earnings");

    if (balanceElement) {
      balanceElement.textContent = walletFormat(balance);
    }

    if (earningsElement) {
      earningsElement.textContent = walletFormat(earnings);
    }

    // Read this user's recent transactions
    const { data: transactions, error: txError } =
      await walletSupabase
        .from("transactions")
        .select("id, description, amount, created_at, status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

    if (txError) {
      throw new Error(
        "Could not load transactions. Check the transactions table and access policies."
      );
    }

    const list = document.getElementById("transaction-list");

    if (list) {
      list.replaceChildren();

      if (!transactions || transactions.length === 0) {
        const empty = document.createElement("li");
        empty.textContent = "No transactions yet.";
        list.appendChild(empty);
      } else {
        transactions.forEach((tx) => {
          const item = document.createElement("li");
          const title = document.createElement("strong");
          const details = document.createElement("p");

          title.textContent = tx.description || "Transaction";

          const date = tx.created_at
            ? new Date(tx.created_at).toLocaleDateString("en-NG")
            : "";

          details.textContent =
            `${walletFormat(tx.amount)} · ${tx.status || "Pending"} · ${date}`;

          item.append(title, details);
          list.appendChild(item);
        });
      }
    }

    walletMessage("Wallet loaded successfully!");
  } catch (error) {
    console.error("EarnFlex wallet error:", error);
    walletMessage(error.message || "Unable to load wallet.");
  }
}

// Refresh button
document
  .getElementById("refresh-wallet")
  ?.addEventListener("click", loadWallet);

// Automatically refresh when the user returns to the page
walletSupabase.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
    setTimeout(loadWallet, 0);
  }
});

// Initial load
loadWallet();
      
