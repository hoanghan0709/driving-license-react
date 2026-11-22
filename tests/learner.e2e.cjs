const assert = require('node:assert/strict')
const { randomUUID } = require('node:crypto')
const { test } = require('node:test')
const { chromium } = require('playwright')

test('study, switch license, resume, submit, and review exams through the Go API', async (t) => {
  const baseUrl = process.env.AUTH_TEST_URL || 'http://localhost:5173'
  const adminEmail = process.env.LEARNER_TEST_ADMIN_EMAIL
  const adminPassword = process.env.LEARNER_TEST_ADMIN_PASSWORD
  assert.ok(adminEmail && adminPassword, 'Set credentials for an admin on an isolated test database.')

  const browser = await chromium.launch({ executablePath: process.env.CHROME_EXECUTABLE })
  t.after(() => browser.close())
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.setDefaultTimeout(10_000)
  const api = async (path, { method = 'GET', data, token, status = 200 } = {}) => {
    const response = await page.request.fetch(baseUrl + '/backend' + path, {
      method, data, headers: token ? { Authorization: 'Bearer ' + token } : undefined,
    })
    assert.equal(response.status(), status, `${method} ${path}`)
    return response.json()
  }
  const admin = (await api('/auth/login', {
    method: 'POST', data: { email: adminEmail, password: adminPassword },
  })).data.access_token
  const create = (path, data) => api('/api/v1/admin/' + path, { method: 'POST', data, token: admin, status: 201 })
  const suffix = randomUUID().slice(0, 8)
  const category = await create('categories', { name: 'Chủ đề mẫu ' + suffix, type: 'SIGN' })
  const sign = await create('road-signs', {
    code: 'Mẫu-' + suffix, name: 'Biển mẫu', image: 'https://example.invalid/sign.png',
    meaning: 'Dữ liệu kiểm thử', license_type: 'A1', sign_type: 'WARNING', category_id: category.id, published: true,
  })
  const title = 'Câu hỏi mẫu ' + suffix
  const question = await create('questions', {
    title, content: 'Dữ liệu kiểm thử', explanation: 'Giải thích mẫu', license_type: 'A1',
    category_id: category.id, road_sign_id: sign.id, published: true,
    answers: [
      { label: 'A', content: 'Phương án đúng', order: 1, is_correct: true },
      { label: 'B', content: 'Phương án sai', order: 2, is_correct: false },
    ],
  })
  const config = { license_type: 'A1', version: 'fixture', duration_minutes: 5, passing_score: 1, published: true }
  const fixed = 'Đề mẫu ' + suffix
  await create('tests', { ...config, name: fixed, question_ids: [question.id] })
  const random = 'Cấu hình mẫu ' + suffix
  await create('exam-templates', { ...config, name: random, quotas: [{ category_id: category.id, count: 1 }] })

  const email = `learner-${randomUUID()}@example.com`
  const password = 'Learner-sample-password-123'
  await api('/auth/register', { method: 'POST', data: { name: 'Học viên kiểm thử', email, password }, status: 201 })
  await page.goto(baseUrl + '/exams/history')
  await page.waitForURL('**/login')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await page.waitForURL('**/dashboard')
  assert.equal(await page.getByRole('link', { name: 'Mở trang quản trị' }).count(), 0)
  const saveLicense = async (code) => {
    await page.getByLabel('Đổi hạng bằng đang ôn').selectOption(code)
    await page.getByRole('button', { name: 'Lưu hạng bằng' }).click()
    await page.getByText('Đã lưu hạng bằng.', { exact: true }).waitFor()
  }
  await saveLicense('A1')
  await page.getByRole('link', { name: 'Luyện câu hỏi', exact: true }).click()
  await page.getByLabel('Chủ đề', { exact: true }).selectOption(String(category.id))
  const card = page.locator('section').filter({ has: page.getByRole('heading', { name: new RegExp(title) }) })
  assert.equal(await card.getByText('Đáp án đúng', { exact: false }).count(), 0)
  await card.getByRole('radio', { name: /Phương án sai/ }).check()
  await card.getByRole('button', { name: 'Kiểm tra đáp án' }).click()
  await card.getByText('Trả lời sai').waitFor()
  await card.getByText('Giải thích mẫu').waitFor()

  await page.getByRole('link', { name: 'Câu cần ôn lại', exact: true }).click()
  await page.getByRole('heading', { name: new RegExp(title) }).waitFor()
  await page.getByRole('link', { name: 'Biển báo', exact: true }).click()
  await page.getByLabel('Tên hoặc mã biển').fill(sign.code)
  await page.getByRole('button', { name: 'Tìm kiếm' }).click()
  await page.getByRole('link', { name: new RegExp(sign.code) }).click()
  await page.getByRole('heading', { name: 'Câu hỏi liên quan' }).waitFor()
  await page.getByRole('heading', { name: new RegExp(title) }).waitFor()

  await page.getByRole('link', { name: 'Thi thử', exact: true }).click()
  await page.getByRole('listitem').filter({ hasText: fixed }).getByRole('button', { name: 'Bắt đầu thi' }).click()
  await page.waitForURL(/\/exams\/\d+$/)
  await page.route('**/backend/api/v1/exams/*/answers/*', (route) => route.fulfill({ status: 503 }), { times: 1 })
  await page.getByRole('radio', { name: /Phương án đúng/ }).click()
  await page.getByText('Chưa xác nhận được thay đổi.', { exact: false }).waitFor()
  assert.equal(await page.getByRole('button', { name: 'Nộp bài', exact: true }).isDisabled(), true)
  await page.getByRole('button', { name: 'Thử lại' }).click()
  await page.getByRole('radio', { name: /Phương án đúng/ }).click()
  await page.getByText('Đã lưu 1/1 câu').waitFor()
  assert.equal(await page.getByText('Giải thích mẫu').count(), 0)
  await page.reload()
  await page.getByText('Đã lưu 1/1 câu').waitFor()
  assert.equal(await page.getByRole('radio', { name: /Phương án đúng/ }).isChecked(), true)
  await page.getByRole('button', { name: 'Bỏ chọn đáp án' }).click()
  await page.getByText('Đã lưu 0/1 câu').waitFor()
  await page.getByRole('radio', { name: /Phương án đúng/ }).click()
  await page.getByText('Đã lưu 1/1 câu').waitFor()
  await page.getByRole('button', { name: 'Nộp bài', exact: true }).click()
  await page.getByRole('button', { name: 'Nộp bài ngay' }).click()
  await page.getByRole('heading', { name: 'Kết quả · Đạt' }).waitFor()
  await page.getByText('Giải thích mẫu').waitFor()
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 375)

  await page.getByRole('link', { name: 'Thi thử', exact: true }).click()
  await page.getByLabel('Loại đề').selectOption('random')
  await page.getByRole('listitem').filter({ hasText: random }).getByRole('button', { name: 'Bắt đầu thi' }).click()
  await page.waitForURL(/\/exams\/\d+$/)
  const randomUrl = page.url()
  await page.getByRole('link', { name: 'Lịch sử thi', exact: true }).click()
  await page.getByLabel('Trạng thái').selectOption('DOING')
  await page.getByRole('link', { name: 'Tiếp tục thi', exact: true }).click()
  await page.waitForURL(randomUrl)

  await page.getByRole('link', { name: 'Bảng điều khiển' }).click()
  await saveLicense('B')
  await page.getByRole('link', { name: 'Luyện câu hỏi', exact: true }).click()
  await page.getByText('Chưa có câu hỏi trong phạm vi này.').waitFor()
  await page.getByRole('link', { name: 'Lịch sử thi', exact: true }).click()
  await page.getByRole('link', { name: 'Xem kết quả', exact: true }).click()
  await page.getByRole('heading', { name: 'Kết quả · Đạt' }).waitFor()
  assert.deepEqual(errors, [])
})

test('an administrator can open and use the embedded Go admin UI through the web proxy', async (t) => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_EXECUTABLE })
  t.after(() => browser.close())
  const page = await browser.newPage()
  await page.goto((process.env.AUTH_TEST_URL || 'http://localhost:5173') + '/login')
  const login = async () => {
    await page.getByLabel('Email', { exact: true }).fill(process.env.LEARNER_TEST_ADMIN_EMAIL)
    await page.getByLabel('Mật khẩu', { exact: true }).fill(process.env.LEARNER_TEST_ADMIN_PASSWORD)
    await page.getByRole('button', { name: /^Đăng nhập/ }).click()
  }
  await login()
  await page.getByRole('link', { name: 'Mở trang quản trị' }).click()
  await page.waitForURL('**/backend/admin/')
  await page.getByRole('heading', { name: 'Đăng nhập quản trị' }).waitFor()
  await login()
  await page.getByRole('button', { name: /Danh mục API/ }).click()
  await page.getByText('/api/v1/exams/random', { exact: true }).waitFor()
})
