let artworks = [];
        let filteredArtworks = [];
        let currentPage = 1;
        const itemsPerPage = 9;
        let currentView = 'grid'; // 'grid' or 'list'

        // DOM Elements
        const artworksContainer = document.getElementById('artworksContainer');
        const loadingElement = document.getElementById('loading');
        const emptyStateElement = document.getElementById('emptyState');
        const paginationElement = document.getElementById('pagination');
        const pageInfoElement = document.getElementById('pageInfo');
        const prevPageBtn = document.getElementById('prevPage');
        const nextPageBtn = document.getElementById('nextPage');
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        const sortSelect = document.getElementById('sortSelect');
        const filterSelect = document.getElementById('filterSelect');
        const loadArtworksBtn = document.getElementById('loadArtworks');
        const randomArtworkBtn = document.getElementById('randomArtwork');
        const toggleViewBtn = document.getElementById('toggleView');
        const resetSearchBtn = document.getElementById('resetSearch');
        const zoomModal = document.getElementById('zoomModal');
        const closeModalBtn = document.getElementById('closeModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalImg = document.getElementById('modalImg');
        const modalArtist = document.getElementById('modalArtist');
        const modalDate = document.getElementById('modalDate');
        const modalMedium = document.getElementById('modalMedium');
        const modalDimensions = document.getElementById('modalDimensions');
        const modalDescription = document.getElementById('modalDescription');
        const modalDepartment = document.getElementById('modalDepartment');

        // Base API URL
        const API_BASE = 'https://api.artic.edu/api/v1/artworks';
        const IMAGE_BASE = 'https://www.artic.edu/iiif/2';

        // Initialize the museum
        document.addEventListener('DOMContentLoaded', () => {
            loadArtworks();
            
            // Event Listeners
            loadArtworksBtn.addEventListener('click', loadArtworks);
            randomArtworkBtn.addEventListener('click', showRandomArtwork);
            toggleViewBtn.addEventListener('click', toggleView);
            resetSearchBtn.addEventListener('click', resetSearch);
            searchBtn.addEventListener('click', performSearch);
            searchInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') performSearch();
            });
            sortSelect.addEventListener('change', applySortAndFilter);
            filterSelect.addEventListener('change', applySortAndFilter);
            closeModalBtn.addEventListener('click', closeModal);
            zoomModal.addEventListener('click', (e) => {
                if (e.target === zoomModal) closeModal();
            });
            prevPageBtn.addEventListener('click', goToPrevPage);
            nextPageBtn.addEventListener('click', goToNextPage);
            
            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') closeModal();
                if (e.key === 'ArrowLeft' && zoomModal.classList.contains('active')) navigateModalArtwork('prev');
                if (e.key === 'ArrowRight' && zoomModal.classList.contains('active')) navigateModalArtwork('next');
            });
        });

        // Load artworks from API
        async function loadArtworks() {
            showLoading();
            clearArtworks();
            
            try {
                // Get random page to get varied results
                const randomPage = Math.floor(Math.random() * 100) + 1;
                const response = await fetch(`${API_BASE}?limit=50&page=${randomPage}&fields=id,title,artist_display,date_display,medium_display,dimensions,department_title,image_id,thumbnail,artist_title,place_of_origin,credit_line`);
                
                if (!response.ok) {
                    throw new Error(`API Error: ${response.status}`);
                }
                
                const data = await response.json();
                artworks = data.data.filter(artwork => artwork.image_id); // Only artworks with images
                
                if (artworks.length === 0) {
                    showEmptyState();
                    return;
                }
                
                // Apply any existing filters/sort
                applySortAndFilter();
                
            } catch (error) {
                console.error('Error fetching artworks:', error);
                artworksContainer.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #e74c3c; margin-bottom: 20px;"></i>
                        <h3 style="color: #2c3e50; margin-bottom: 10px;">Failed to Load Artworks</h3>
                        <p style="color: #7f8c8d;">Please check your internet connection and try again.</p>
                    </div>
                `;
            }
        }

        // Display artworks in grid
        function displayArtworks(artworksToDisplay) {
            clearArtworks();
            
            if (artworksToDisplay.length === 0) {
                showEmptyState();
                return;
            }
            
            hideEmptyState();
            
            // Calculate pagination
            const totalPages = Math.ceil(artworksToDisplay.length / itemsPerPage);
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginatedArtworks = artworksToDisplay.slice(startIndex, endIndex);
            
            // Create artwork cards
            paginatedArtworks.forEach(artwork => {
                const card = createArtCard(artwork);
                artworksContainer.appendChild(card);
            });
            
            // Update pagination controls
            updatePagination(totalPages);
        }

        // Create an artwork card element
        function createArtCard(artwork) {
            const card = document.createElement('div');
            card.className = 'art-card';
            card.dataset.id = artwork.id;
            
            const imageUrl = artwork.image_id 
                ? `${IMAGE_BASE}/${artwork.image_id}/full/400,/0/default.jpg`
                : 'https://via.placeholder.com/400x300/ecf0f1/7f8c8d?text=No+Image+Available';
            
            const title = artwork.title || 'Untitled';
            const artist = artwork.artist_title || 'Unknown Artist';
            const date = artwork.date_display || 'Unknown Date';
            const medium = artwork.medium_display || 'Unknown Medium';
            
            card.innerHTML = `
                <div class="card-img-container">
                    <img class="art-img" src="${imageUrl}" alt="${title}" loading="lazy">
                </div>
                <div class="card-content">
                    <h3 class="art-title">${title}</h3>
                    <p class="art-artist">${artist}</p>
                    <p class="art-date">${date}</p>
                    <p class="art-medium">${medium}</p>
                    <div class="card-footer">
                        <span><i class="fas fa-eye"></i> Click to zoom</span>
                        <span><i class="fas fa-expand"></i> View details</span>
                    </div>
                </div>
            `;
            
            // Add click event to open zoom modal
            card.addEventListener('click', () => openModal(artwork));
            
            return card;
        }

        // Open zoom modal with artwork details
        function openModal(artwork) {
            const highResImageUrl = artwork.image_id 
                ? `${IMAGE_BASE}/${artwork.image_id}/full/1200,/0/default.jpg`
                : 'https://via.placeholder.com/1200x900/ecf0f1/7f8c8d?text=No+Image+Available';
            
            modalTitle.textContent = artwork.title || 'Untitled';
            modalImg.src = highResImageUrl;
            modalImg.alt = artwork.title || 'Artwork';
            modalArtist.textContent = artwork.artist_title || 'Unknown Artist';
            modalDate.textContent = artwork.date_display || 'Unknown Date';
            modalMedium.textContent = artwork.medium_display || 'Unknown Medium';
            modalDimensions.textContent = artwork.dimensions || 'Unknown Dimensions';
            modalDepartment.textContent = artwork.department_title || 'Unknown Department';
            
            // Try to get a description from various fields
            const description = artwork.credit_line || artwork.place_of_origin || 'No description available for this artwork.';
            modalDescription.textContent = description;
            
            // Store current artwork index for navigation
            const currentIndex = filteredArtworks.findIndex(item => item.id === artwork.id);
            zoomModal.dataset.currentIndex = currentIndex;
            
            zoomModal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        }

        // Navigate between artworks in modal view
        function navigateModalArtwork(direction) {
            const currentIndex = parseInt(zoomModal.dataset.currentIndex);
            let newIndex;
            
            if (direction === 'prev') {
                newIndex = currentIndex > 0 ? currentIndex - 1 : filteredArtworks.length - 1;
            } else {
                newIndex = currentIndex < filteredArtworks.length - 1 ? currentIndex + 1 : 0;
            }
            
            openModal(filteredArtworks[newIndex]);
        }

        // Close zoom modal
        function closeModal() {
            zoomModal.classList.remove('active');
            document.body.style.overflow = 'auto'; // Re-enable scrolling
        }

        // Search artworks
        function performSearch() {
            const query = searchInput.value.trim().toLowerCase();
            
            if (!query) {
                // If search is empty, show all artworks
                filteredArtworks = [...artworks];
            } else {
                filteredArtworks = artworks.filter(artwork => {
                    const title = artwork.title ? artwork.title.toLowerCase() : '';
                    const artist = artwork.artist_title ? artwork.artist_title.toLowerCase() : '';
                    const medium = artwork.medium_display ? artwork.medium_display.toLowerCase() : '';
                    const department = artwork.department_title ? artwork.department_title.toLowerCase() : '';
                    
                    return title.includes(query) || 
                           artist.includes(query) || 
                           medium.includes(query) ||
                           department.includes(query);
                });
            }
            
            currentPage = 1;
            applySortAndFilter();
        }

        // Apply sorting and filtering
        function applySortAndFilter() {
            let results = filteredArtworks.length > 0 ? [...filteredArtworks] : [...artworks];
            
            // Apply filter by medium
            const filterValue = filterSelect.value;
            if (filterValue) {
                results = results.filter(artwork => {
                    const medium = artwork.medium_display ? artwork.medium_display.toLowerCase() : '';
                    return medium.includes(filterValue.toLowerCase());
                });
            }
            
            // Apply sorting
            const sortValue = sortSelect.value;
            if (sortValue) {
                results.sort((a, b) => {
                    switch (sortValue) {
                        case 'title':
                            const titleA = a.title || '';
                            const titleB = b.title || '';
                            return titleA.localeCompare(titleB);
                        case 'artist':
                            const artistA = a.artist_title || '';
                            const artistB = b.artist_title || '';
                            return artistA.localeCompare(artistB);
                        case 'date':
                            const dateA = a.date_display || '';
                            const dateB = b.date_display || '';
                            return dateA.localeCompare(dateB);
                        case 'date-desc':
                            const dateADesc = a.date_display || '';
                            const dateBDesc = b.date_display || '';
                            return dateBDesc.localeCompare(dateADesc);
                        default:
                            return 0;
                    }
                });
            }
            
            filteredArtworks = results;
            displayArtworks(filteredArtworks);
        }

        // Show a random artwork
        function showRandomArtwork() {
            if (filteredArtworks.length > 0) {
                const randomIndex = Math.floor(Math.random() * filteredArtworks.length);
                openModal(filteredArtworks[randomIndex]);
            } else if (artworks.length > 0) {
                const randomIndex = Math.floor(Math.random() * artworks.length);
                openModal(artworks[randomIndex]);
            }
        }

        // Toggle between grid and list view
        function toggleView() {
            if (currentView === 'grid') {
                artworksContainer.style.gridTemplateColumns = '1fr';
                currentView = 'list';
                toggleViewBtn.innerHTML = '<i class="fas fa-th"></i> Grid View';
            } else {
                artworksContainer.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
                currentView = 'grid';
                toggleViewBtn.innerHTML = '<i class="fas fa-th-large"></i> Toggle View';
            }
        }

        // Reset search and filters
        function resetSearch() {
            searchInput.value = '';
            sortSelect.value = '';
            filterSelect.value = '';
            filteredArtworks = [...artworks];
            currentPage = 1;
            displayArtworks(filteredArtworks);
        }

        // Pagination functions
        function updatePagination(totalPages) {
            if (totalPages <= 1) {
                paginationElement.style.display = 'none';
                return;
            }
            
            paginationElement.style.display = 'flex';
            pageInfoElement.textContent = `Page ${currentPage} of ${totalPages}`;
            
            prevPageBtn.disabled = currentPage === 1;
            nextPageBtn.disabled = currentPage === totalPages;
            
            prevPageBtn.classList.toggle('disabled', currentPage === 1);
            nextPageBtn.classList.toggle('disabled', currentPage === totalPages);
        }

        function goToPrevPage() {
            if (currentPage > 1) {
                currentPage--;
                displayArtworks(filteredArtworks);
            }
        }

        function goToNextPage() {
            const totalPages = Math.ceil(filteredArtworks.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                displayArtworks(filteredArtworks);
            }
        }

        // Utility functions
        function showLoading() {
            loadingElement.style.display = 'block';
            artworksContainer.innerHTML = '';
            paginationElement.style.display = 'none';
            hideEmptyState();
        }

        function clearArtworks() {
            loadingElement.style.display = 'none';
            artworksContainer.innerHTML = '';
        }

        function showEmptyState() {
            emptyStateElement.style.display = 'block';
            paginationElement.style.display = 'none';
        }

        function hideEmptyState() {
            emptyStateElement.style.display = 'none';
        }