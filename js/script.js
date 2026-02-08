window.addEventListener("DOMContentLoaded", function() {
  const html            = document.querySelector("html");
  const navBtn          = document.querySelector(".navbar-btn");
  const navList         = document.querySelector(".navbar-list");
  const backToTopFixed  = document.querySelector(".back-to-top-fixed");
  const walletBtn       = document.querySelector("[data-wallet-connect]");
  const walletPanel     = document.querySelector("[data-wallet-panel]");
  const walletCopyBtn   = document.querySelector("[data-wallet-copy]");
  const walletDisBtn    = document.querySelector("[data-wallet-disconnect]");
  const walletHint      = document.querySelector("[data-wallet-comment-hint]");
  let lastTop           = 0;
  let theme             = window.localStorage.getItem('theme') || '';

  theme && html.classList.add(theme)

  const goScrollTop = () => {
    let currentTop = getScrollTop()
    let speed = Math.floor(-currentTop / 10)
    if (currentTop > lastTop) {
      return lastTop = 0
    }
    let distance = currentTop + speed;
    lastTop = distance;
    document.documentElement.scrollTop = distance;
    distance > 0 && window.requestAnimationFrame(goScrollTop)
  }

  const toggleBackToTopBtn = (top) => {
    top = top || getScrollTop()
    if (top >= 100) {
      backToTopFixed.classList.add("show")
    } else {
      backToTopFixed.classList.remove("show")
    }
  }

  toggleBackToTopBtn()

  // theme light click
  document.querySelector('#theme-light').addEventListener('click', function () {
    html.classList.remove('theme-dark')
    html.classList.add('theme-light')
    window.localStorage.setItem('theme', 'theme-light')
  })

  // theme dark click
  document.querySelector('#theme-dark').addEventListener('click', function () {
    html.classList.remove('theme-light')
    html.classList.add('theme-dark')
    window.localStorage.setItem('theme', 'theme-dark')
  })

  // theme auto click
  document.querySelector('#theme-auto').addEventListener('click', function() {
    html.classList.remove('theme-light')
    html.classList.remove('theme-dark')
    window.localStorage.setItem('theme', '')
  })

  // mobile nav click
  navBtn.addEventListener("click", function () {
    html.classList.toggle("show-mobile-nav");
    this.classList.toggle("active");
  });

  // mobile nav link click
  navList.addEventListener("click", function (e) {
    if (e.target.nodeName == "A" && html.classList.contains("show-mobile-nav")) {
      navBtn.click()
    }
  })

  // click back to top
  backToTopFixed.addEventListener("click", function () {
    lastTop = getScrollTop()
    goScrollTop()
  });

  window.addEventListener("scroll", function () {
    toggleBackToTopBtn()
  }, { passive: true });

  /** handle lazy bg iamge */
  handleLazyBG();

  if (walletBtn) {
    initWalletButton({
      button: walletBtn,
      panel: walletPanel,
      copyBtn: walletCopyBtn,
      disconnectBtn: walletDisBtn,
      hint: walletHint
    })
  }
});

/**
 * 获取当前滚动条距离顶部高度
 *
 * @returns 距离高度
 */
function getScrollTop () {
  return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
}

function querySelectorArrs (selector) {
  return Array.from(document.querySelectorAll(selector))
}


function handleLazyBG () {
  const lazyBackgrounds = querySelectorArrs('[background-image-lazy]')
  let lazyBackgroundsCount = lazyBackgrounds.length
  if (lazyBackgroundsCount > 0) {
    let lazyBackgroundObserver = new IntersectionObserver(function(entries, observer) {
      entries.forEach(function({ isIntersecting, target }) {
        if (isIntersecting) {
          let img = target.dataset.img
          if (img) {
            target.style.backgroundImage = `url(${img})`
          }
          lazyBackgroundObserver.unobserve(target)
          lazyBackgroundsCount --
        }
        if (lazyBackgroundsCount <= 0) {
          lazyBackgroundObserver.disconnect()
        }
      })
    })

    lazyBackgrounds.forEach(function(lazyBackground) {
      lazyBackgroundObserver.observe(lazyBackground)
    })
  }
}

function initWalletButton ({ button, panel, copyBtn, disconnectBtn, hint }) {
  const provider = window.ethereum
  const disconnectFlagKey = "wallet-disconnected"
  const setDisconnected = () => {
    button.textContent = "连接钱包"
    button.dataset.walletConnected = "false"
    button.removeAttribute("title")
    button.dataset.walletAddress = ""
    button.dataset.walletEns = ""
    panel && panel.classList.remove("show")
  }
  const formatAddress = (address) => {
    if (!address) return ""
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }
  const setConnected = (address, ensName) => {
    button.textContent = ensName || formatAddress(address)
    button.dataset.walletConnected = "true"
    button.title = address
    button.dataset.walletAddress = address
    button.dataset.walletEns = ensName || ""
  }
  const togglePanel = () => {
    if (!panel) return
    panel.classList.toggle("show")
  }
  const closePanel = () => {
    if (!panel) return
    panel.classList.remove("show")
  }
  const getConnectedAddress = () => button.dataset.walletAddress || button.title || ""
  const getConnectedEns = () => button.dataset.walletEns || ""
  const shouldStayDisconnected = () => window.sessionStorage.getItem(disconnectFlagKey) === "1"
  const clearDisconnectFlag = () => window.sessionStorage.removeItem(disconnectFlagKey)
  const canResolveEns = () => !!(window.ethers && window.ethers.BrowserProvider)
  const resolveEns = async (address) => {
    if (!canResolveEns()) return ""
    try {
      const provider = new window.ethers.BrowserProvider(window.ethereum)
      const network = await provider.getNetwork()
      const chainId = typeof network.chainId === "bigint" ? Number(network.chainId) : network.chainId
      if (chainId !== 1) return ""
      const ensName = await provider.lookupAddress(address)
      return ensName || ""
    } catch (error) {
      return ""
    }
  }

  if (!provider || !provider.request) {
    button.addEventListener("click", function () {
      alert("未检测到钱包扩展（如 MetaMask）。")
    })
    return
  }

  const updateCommentIdentity = () => {
    const input = document.querySelector('input[name="nick"], input.vnick')
    if (!input) return
    const ensName = getConnectedEns()
    const address = getConnectedAddress()
    if (ensName || address) {
      input.value = ensName || address
      input.placeholder = "已使用钱包昵称"
      if (hint) hint.textContent = "已连接钱包，将使用钱包昵称显示（可手动修改）。"
    } else {
      input.placeholder = "未连接钱包，使用默认昵称"
      if (hint) hint.textContent = "未连接钱包时，请使用默认昵称留言。"
    }
  }

  const waitForCommentInput = () => {
    let tries = 0
    const timer = setInterval(() => {
      tries += 1
      if (document.querySelector('input[name="nick"], input.vnick')) {
        clearInterval(timer)
        updateCommentIdentity()
      }
      if (tries >= 20) {
        clearInterval(timer)
      }
    }, 300)
  }

  button.addEventListener("click", async function () {
    if (button.dataset.walletConnected === "true") {
      togglePanel()
      return
    }

    button.disabled = true
    button.textContent = "连接中..."
    try {
      const accounts = await provider.request({ method: "eth_requestAccounts" })
      if (accounts && accounts.length > 0) {
        const address = accounts[0]
        clearDisconnectFlag()
        setConnected(address)
        const ensName = await resolveEns(address)
        if (ensName) setConnected(address, ensName)
        closePanel()
        updateCommentIdentity()
      } else {
        setDisconnected()
        updateCommentIdentity()
      }
    } catch (error) {
      setDisconnected()
      updateCommentIdentity()
    } finally {
      button.disabled = false
    }
  })

  if (!shouldStayDisconnected()) {
    provider.request({ method: "eth_accounts" })
      .then(async (accounts) => {
        if (accounts && accounts.length > 0) {
          const address = accounts[0]
          setConnected(address)
          const ensName = await resolveEns(address)
          if (ensName) setConnected(address, ensName)
          updateCommentIdentity()
        } else {
          setDisconnected()
          updateCommentIdentity()
        }
      })
      .catch(() => {
        setDisconnected()
        updateCommentIdentity()
      })
  } else {
    setDisconnected()
    updateCommentIdentity()
  }

  if (copyBtn) {
    copyBtn.addEventListener("click", async function () {
      const address = getConnectedAddress()
      if (!address) return
      try {
        await navigator.clipboard.writeText(address)
        copyBtn.textContent = "已复制"
        setTimeout(() => {
          copyBtn.textContent = "复制地址"
        }, 1200)
      } catch (error) {
        alert("复制失败，请手动复制。")
      }
      closePanel()
    })
  }

  if (disconnectBtn) {
    disconnectBtn.addEventListener("click", function () {
      window.sessionStorage.setItem(disconnectFlagKey, "1")
      setDisconnected()
      updateCommentIdentity()
      closePanel()
    })
  }

  document.addEventListener("click", function (event) {
    if (!panel || !panel.classList.contains("show")) return
    const target = event.target
    const isInside = target && (panel.contains(target) || button.contains(target))
    if (!isInside) closePanel()
  })

  if (provider.on) {
    provider.on("accountsChanged", (accounts) => {
      if (shouldStayDisconnected()) {
        setDisconnected()
        updateCommentIdentity()
        return
      }
      if (accounts && accounts.length > 0) {
        const address = accounts[0]
        setConnected(address)
        resolveEns(address).then((ensName) => {
          if (ensName) setConnected(address, ensName)
          updateCommentIdentity()
        })
      } else {
        setDisconnected()
        updateCommentIdentity()
      }
    })
    provider.on("disconnect", () => {
      setDisconnected()
      updateCommentIdentity()
    })
  }

  waitForCommentInput()
}
