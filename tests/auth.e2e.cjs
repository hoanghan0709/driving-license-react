const assert = require('node:assert/strict')
const { randomUUID } = require('node:crypto')
const { test } = require('node:test')
const { chromium } = require('playwright')

test('register, sign in, restore the dashboard and sign out', async (t) => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_EXECUTABLE })
  t.after(() => browser.close())

  const page = await browser.newPage({ viewport: { width: 375, height: 812 } })
  page.setDefaultTimeout(10_000)
  const pageErrors = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  const baseUrl = process.env.AUTH_TEST_URL || 'http://localhost:5173'
  const email = `learner-${randomUUID()}@example.com`
  const name = 'Học viên kiểm thử'
  const password = 'Sample-password-123'

  const waitForText = async (text) => {
    try {
      await page.getByText(text, { exact: true }).waitFor()
    } catch (error) {
      assert.fail(`${error.message}\n${await page.locator('main').innerText()}\n${pageErrors.join('\n')}`)
    }
  }
  const fillCredentials = async (value) => {
    await page.getByLabel('Email', { exact: true }).fill(email)
    await page.getByLabel('Mật khẩu', { exact: true }).fill(value)
  }
  const waitForResponse = (path, status) =>
    page.waitForResponse((response) => new URL(response.url()).pathname === path && response.status() === status)

  await page.goto(`${baseUrl}/dashboard`)
  await page.waitForURL('**/login')
  await page.getByRole('link', { name: 'Đăng ký', exact: true }).click()
  await page.waitForURL('**/register')
  await page.getByRole('button', { name: 'Đăng ký', exact: true }).click()
  await waitForText('Nhập họ và tên từ 2 đến 100 ký tự.')

  const register = async () => {
    await page.getByLabel('Họ và tên', { exact: true }).fill(name)
    await fillCredentials(password)
    await page.getByRole('button', { name: 'Đăng ký', exact: true }).click()
  }
  await register()
  await page.waitForURL('**/login')
  await waitForText('Tài khoản đã được tạo. Hãy đăng nhập để tiếp tục.')

  await page.getByRole('link', { name: 'Đăng ký', exact: true }).click()
  await register()
  await waitForText('Email này đã được đăng ký.')
  await page.locator('main').getByRole('link', { name: 'Đăng nhập' }).click()
  await page.waitForURL('**/login')
  await page.getByRole('heading', { name: 'Đăng nhập', exact: true }).waitFor()

  await page.route('**/backend/auth/login', (route) => route.fulfill({ status: 502 }), { times: 1 })
  await fillCredentials(password)
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await waitForText('Không kết nối được với máy chủ xác thực. Vui lòng thử lại sau.')

  await fillCredentials('invalid-password')
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await waitForText('Email hoặc mật khẩu không đúng.')

  await fillCredentials(password)
  await Promise.all([
    waitForResponse('/backend/api/v1/progress', 200),
    page.getByRole('button', { name: 'Đăng nhập', exact: true }).click(),
  ])
  await page.waitForURL('**/dashboard')
  await waitForText(`Chào mừng trở lại, ${name}!`)
  await waitForText(email)
  await waitForText('Tất cả hạng bằng lái')
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 375)

  await page.getByRole('link', { name: 'Trang chủ Ôn thi bằng lái', exact: true }).click()
  await page.getByRole('link', { name: 'Bắt đầu ôn tập', exact: true }).click()
  await page.waitForURL(`${baseUrl}/dashboard`)
  await waitForText(`Chào mừng trở lại, ${name}!`)

  await page.route('**/backend/api/v1/progress', (route) => route.fulfill({ status: 503 }), { times: 1 })
  await Promise.all([waitForResponse('/backend/auth/refresh', 200), page.reload()])
  await waitForText('Chưa tải được tiến độ ôn tập.')
  await page.route('**/backend/api/v1/progress', (route) => route.fulfill({ status: 401 }), { times: 1 })
  await Promise.all([
    waitForResponse('/backend/auth/refresh', 200),
    page.getByRole('button', { name: 'Thử lại', exact: true }).click(),
  ])
  await waitForText('Tất cả hạng bằng lái')

  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click()
  await page.waitForURL('**/login')
  await page.goto(`${baseUrl}/dashboard`)
  await page.waitForURL('**/login')
  await page.getByRole('heading', { name: 'Đăng nhập', exact: true }).waitFor()

  await fillCredentials(password)
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await page.waitForURL('**/dashboard')
  await waitForText(`Chào mừng trở lại, ${name}!`)
  await page.route('**/backend/auth/refresh', (route) => route.fulfill({ status: 401 }))
  await page.reload()
  await page.waitForURL('**/login')
})

test('legacy page URLs redirect to English routes and keep query strings and fragments', async (t) => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_EXECUTABLE })
  t.after(() => browser.close())
  const page = await browser.newPage()
  page.setDefaultTimeout(10_000)
  const baseUrl = process.env.AUTH_TEST_URL || 'http://localhost:5173'

  for (const [oldPath, newPath, title] of [
    ['dang-nhap', 'login', 'Đăng nhập'],
    ['dang-ky', 'register', 'Đăng ký'],
    ['kiem-tra', 'system-check', 'Kiểm tra hệ thống'],
  ]) {
    await page.goto(`${baseUrl}/${oldPath}?source=bookmark#main-content`)
    await page.waitForURL(`${baseUrl}/${newPath}?source=bookmark#main-content`)
    await page.getByRole('heading', { name: title, exact: true }).waitFor()
  }

  await page.goto(`${baseUrl}/`)
  await page.getByRole('link', { name: 'Xem lộ trình ôn tập' }).click()
  await page.waitForURL(`${baseUrl}/#study-roadmap`)
  assert.equal(await page.locator('#study-roadmap').evaluate((section) => section === document.activeElement), true)
})

test('home study links and roadmap work on desktop and mobile', async (t) => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_EXECUTABLE })
  t.after(() => browser.close())
  const page = await browser.newPage({ reducedMotion: 'reduce' })
  page.setDefaultTimeout(10_000)
  const baseUrl = process.env.AUTH_TEST_URL || 'http://localhost:5173'

  for (const width of [1440, 375, 320]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(`${baseUrl}/`)
    await page.getByRole('link', { name: 'Xem lộ trình ôn tập' }).click()
    await page.waitForURL(`${baseUrl}/#study-roadmap`)

    const roadmap = page.getByRole('region', { name: 'Lộ trình ôn tập' })
    const instructions = roadmap.locator('summary').filter({ hasText: 'Ôn lý thuyết' })
    const tip = roadmap.getByText('Xác định hạng bằng lái bạn dự định thi', { exact: false })
    await instructions.focus()
    await page.keyboard.press('Enter')
    await tip.waitFor({ state: 'visible' })
    await page.keyboard.press('Enter')
    await tip.waitFor({ state: 'hidden' })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width)

    await page.getByRole('link', { name: 'Bắt đầu ôn tập', exact: true }).click()
    await page.waitForURL(`${baseUrl}/login`)
  }
})
