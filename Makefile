.PHONY: dev
dev:
	$(MAKE) -C src-tauri dev

.PHONY: dev-frontend
dev-frontend:
	$(MAKE) -C frontend dev

.PHONY: build
build:
	$(MAKE) -C src-tauri build

.PHONY: dist
dist:
	$(MAKE) -C frontend build
	rm -rf src-tauri/dist
	cp -r frontend/.output/public src-tauri/dist

.PHONY: ship
ship: dist
	cd src-tauri && cargo tauri build --no-bundle

.PHONY: bundle
bundle: dist
	cd src-tauri && cargo tauri build

.PHONY: publish
publish: dist
	cd src-tauri && cargo publish --no-verify

.PHONY: check
check:
	$(MAKE) -C src-tauri check

.PHONY: lint
lint:
	$(MAKE) -C src-tauri check
	$(MAKE) -C frontend lint

.PHONY: fmt
fmt:
	$(MAKE) -C src-tauri fmt
	$(MAKE) -C frontend fmt

.PHONY: clean
clean:
	$(MAKE) -C src-tauri clean
	$(MAKE) -C frontend clean
