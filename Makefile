.PHONY: dev
dev:
	$(MAKE) -C src-tauri dev

.PHONY: dev-frontend
dev-frontend:
	$(MAKE) -C frontend dev

.PHONY: build
build:
	$(MAKE) -C src-tauri build

.PHONY: check
check:
	$(MAKE) -C src-tauri check
	$(MAKE) -C frontend check

.PHONY: fmt
fmt:
	$(MAKE) -C src-tauri fmt
	$(MAKE) -C frontend fmt

.PHONY: clean
clean:
	$(MAKE) -C src-tauri clean
	$(MAKE) -C frontend clean
