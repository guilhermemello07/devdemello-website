# Deployment Checklist — devdemello.com on GitHub Pages

## One-time GitHub repo setup

1. Go to **GitHub repo → Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Push to `main` to trigger the first deploy.
4. After the Actions run completes successfully, return to **Settings → Pages**:
   - Set **Custom domain** to `devdemello.com` and save.
   - Once the TLS certificate provisions, tick **Enforce HTTPS**.

## DNS records (at your domain registrar)

### Apex domain — A records (IPv4)

| Type | Name | Value |
|------|------|-------|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |

### Apex domain — AAAA records (IPv6, optional but recommended)

| Type | Name | Value |
|------|------|-------|
| AAAA | `@` | `2606:50c0:8000::153` |
| AAAA | `@` | `2606:50c0:8001::153` |
| AAAA | `@` | `2606:50c0:8002::153` |
| AAAA | `@` | `2606:50c0:8003::153` |

### www subdomain — CNAME

| Type | Name | Value |
|------|------|-------|
| CNAME | `www` | `guilhermemello07.github.io` |

> **Note:** Confirm your exact GitHub username. The CNAME target must be `<your-github-username>.github.io`.
> The username above (`guilhermemello07`) is from the CV — update if different.

## Verification

After DNS propagates (can take up to 48 hours, usually much faster):

- `https://devdemello.com` should load the site with a valid TLS certificate.
- `https://www.devdemello.com` should redirect to the apex domain.
- GitHub Pages Settings should show the custom domain as verified (green check).
