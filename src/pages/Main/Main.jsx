import React, { useState, useEffect } from 'react';
import { getIds, getItems } from '../../api/api'
import Filter from '../../components/Filter/Filter';
import Header from '../../components/Header/Header';
import Content from '../../components/Content/Content';
import { CgSpinner } from 'react-icons/cg';
import './main.css'

const Main = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFounded, setNotFounded] = useState('')
  const [page, setPage] = useState(1);
  const [duplicates, setDuplicates] = useState([0]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [filterResults, setFilterResults] = useState(null);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);

  const removeDuplicates = async (offset, ids) => {
    let dubOffset = offset;
    let dubLimit = 0;
    while (ids.length < 50) {
      dubOffset += ids.length + 1 + dubLimit;
      dubLimit = 50 - ids.length
      let idsResponse
      idsResponse = await getIds({ offset: dubOffset, limit: dubLimit });
      let newIds = Array.from(new Set(idsResponse.result));
      ids = [...new Set([...ids, ...newIds])];
    }
    setDuplicates(prevDuplicates => {
      let newDuplicates = [...prevDuplicates];
      newDuplicates[page] = dubLimit;
      return newDuplicates;
    });
    return ids;
  }

  const fetchData = async (filteredIds) => {
    setLoading(true);
    const offset = (page - 1) * 50 + duplicates.slice(0, page).reduce((a, b) => a + b, 0);
    let ids = [];
    let allFilteredIds = filteredIds;
    if (allFilteredIds && allFilteredIds.length > 0) {
      let newIds = Array.from(new Set(allFilteredIds.slice(offset, offset + 50)));
      ids = [...new Set([...ids, ...newIds])];
      setHasNextPage(allFilteredIds.length - (50 * page) > 0)
    } else {
      let idsResponse = await getIds({ offset: offset, limit: 50 });
      let newIds = Array.from(new Set(idsResponse.result));
      ids = [...new Set([...ids, ...newIds])];
      ids = await removeDuplicates(offset, ids);
      const nextItemsResponse = await getIds({ offset: offset + 50, limit: 1 });
      setHasNextPage(nextItemsResponse.result.length > 0);
    }
    const itemsResponse = await getItems({ ids });
    const itemsMap = new Map();
    itemsResponse.result.forEach(item => {
      if (!itemsMap.has(item.id)) {
        itemsMap.set(item.id, item);
      }
    });
    const uniqueItems = Array.from(itemsMap.values());
    setItems(uniqueItems);
    setLoading(false);
  };  

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchData(filterResults);
  }, [page]);

  const toggleFilter = () => {
    setIsFilterVisible(prevState => !prevState);
  };

  const handleScroll = () => {
    const position = window.pageYOffset;
    if (position > scrollPosition && isFilterVisible) {
      setIsFilterVisible(false);
    }
    setScrollPosition(position);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrollPosition, isFilterVisible]);

  return (
    <div className='main'>
      <div className='header'>
      <Header toggleFilter={toggleFilter}/>
      </div>
      <div className='header-undertext'>
        <p className='undertext'>Каталог ювелирных изделий</p>
      </div>
      <div className='notFounded-box'>
        <div className='notFounded'>
          {notFounded}
        </div>
      </div>
      <div className='content'>
        <div className={`filter ${isFilterVisible ? '' : 'hidden'}`}>
        <Filter setItems={setItems} 
        setLoading={setLoading} 
        setNotFounded={setNotFounded}  
        setPage={setPage}
        fetchData={fetchData}
        setDuplicates={setDuplicates}
        setHasNextPage={setHasNextPage}
        setFilterResults={setFilterResults}
        setIsFilterVisible={setIsFilterVisible}
        />
        </div>
        {loading ? (
          <CgSpinner className="spinner" size={45}/>
        ) : notFounded ? (
          ''
        ) : (
           <Content items={items} setItems={setItems}/>
        )}
      </div>
      <div className='page-buttons-box'>
        {page > 1 && !loading && (
          <button className='page-buttons' onClick={() => setPage(prevPage => prevPage - 1)}>Предыдущая страница</button>
        )}
        {hasNextPage && !loading && !notFounded &&(
          <button className='page-buttons' onClick={() => setPage(prevPage => prevPage + 1)}>Следующая страница</button>
        )}
      </div>
    </div>
  );
}

export default Main;