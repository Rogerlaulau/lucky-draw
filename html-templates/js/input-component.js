/** @jsx React.DOM */

var Machine = function(updateCandidatesCallback, resultCallback) {

	var sockjs_url = '/sock';
	var sockjs = new SockJS(sockjs_url);

	sockjs.onopen    = function() {};

	sockjs.onmessage = function(e) {
		var obj = JSON.parse(e.data);
		// Super lazy implementation
		if (obj.candidates) {
			updateCandidatesCallback(obj.candidates);
		} else if (obj.poorMan) {
			resultCallback(obj.poorMan);
		}
	};

	sockjs.onclose = function() {};

	$('#rand').bind('click', function() {
		$.get('/rand', {}, function(){});
	});

	// The public API encapsulated the data accessing logic
	return {
		addCandidate: function(v) {
			$.get('/addCandidate', {'candidate': v});
		},
		removeCandidate: function (v) {
			$.get('/removeCandidate', { 'candidate': v });
		},
		clearCandidates: function() {
            $.get('/clearCandidates');
		},		
		rand: function() {
			$.get('/rand');
		}
	}
};

var machine;

var CandidateList = React.createClass({
  render: function() {
	var onDelete = this.props.onDelete;
    var createItem = function(itemText) {	
      return <li id={itemText}>{itemText}<span className="delete" title="Delete" onClick={onDelete.bind(this,itemText)}><i className="fa fa-minus-circle"></i></span></li>
    };
    return <ul className="item-list">{this.props.items.map(createItem)}</ul>;
  }
});

var InputForm = React.createClass({
  getInitialState: function() {
    return {items: []};
  },
  componentDidMount: function() {
	var dom = this.refs.candidateInput.getDOMNode();
	dom.setAttribute("x-webkit-speech");
	
	var reactCpn = this;
	machine = new Machine(function(candidates) {		
		reactCpn.setState({items: candidates});
	}, function(poorMan) {

		// TODO convert these to React style
            $('.main-container').removeClass('show animated fadeOutUp');
            $('.main-container').addClass('hide');
            $('#rolling-view-container').addClass('show animated fadeInDown');

            function loopAndLoop(counter) {
                var itemsArr = [];
                var $items = $('.item-list li').clone().each(function(i, v){
                    itemsArr[i] = $('<li>').append($(v).text());
                });
                // this is not animation...
                var $rolling = $('ul.rolling-list');
                var newItemsOrder = itemsArr.slice((counter - 2) % $items.length).concat(itemsArr.slice(0, (counter - 2) % $items.length));
                $rolling.empty();
                for (var i = 0; i < newItemsOrder.length; i++) {
                    $rolling.append(newItemsOrder[i]);
                }

                var nextTime = 100;
				var winHeight = $(window).height();
                $('.rolling-list').css({
                    'height': winHeight-60,
                    'width': winHeight
                });
                $('.rolling-list li').css({
                    'font-size': winHeight/85 + 'em',
                    'margin-top': '10px'
                });
                $('.mask').css({
                    'height': winHeight/2.6
                });

                if (counter > $items.length) {

                    if ($($items.get((counter) % $items.length)).prop('id') == poorMan) {

                        $('#winner-span').text(poorMan);
                        setTimeout(function() {

                            $('.main-container').removeClass('show animated fadeOutUp');
                            $('.main-container').addClass('hide');
                            $('#result-view-container').addClass('show animated fadeInDown');
                        }, 1000);
                        return;
                    } else if ($($items.get((counter+1) % $items.length)).prop('id') == poorMan) {
                        nextTime = 800;
                    } else if ($($items.get((counter+2) % $items.length)).prop('id') == poorMan) {
                        nextTime = 500;
                    } else if ($($items.get((counter+3) % $items.length)).prop('id') == poorMan) {
                        nextTime = 300;
                    }
                }
                if (counter < $items.length * 2) {

                    setTimeout(function() {
                        loopAndLoop(++counter);
                    }, nextTime);
                }
            }
            loopAndLoop(0);
        });	
  },
  handleAdd: function(e) {
	e.preventDefault();
	var val = this.refs.candidateInput.getDOMNode().value.trim();
	this.refs.candidateInput.getDOMNode().value = "";	
	machine.addCandidate(val);
  },
  handleDelete: function(val){
	machine.removeCandidate(val);
  },
  handleDeleteAll: function(e){
	machine.clearCandidates();  
  },  
  handleInputDone: function(e){
     $('.main-container').removeClass('show animated fadeOutUp');
     $('.main-container').addClass('hide');
     $('#start-view-container').addClass('show animated fadeInDown');  
  },
  render: function() {
    return (
		<div>
            <h1>Edit Items</h1>
            <form id="edit-item-form" onSubmit={this.handleAdd}>
                <input type="text" placeholder="Enter item name" id="new-candidate" ref="candidateInput"/>
                <button className="btn positive-btn" title="Add" onClick={this.handleAdd}><i className="fa fa-plus"></i></button>
                <div className="item-list-container">
                    <h2>Items List</h2>
					<CandidateList items={this.state.items} onDelete={this.handleDelete}/>
					<div className="text-right"><a className="delete-all" onClick={this.handleDeleteAll}><i className="fa fa-times"></i>Delete All</a></div>
                </div>
                <div className="btn-set">
                <button className="btn primary-btn btn-done" onClick={this.handleInputDone}>Done</button>
                </div>
            </form>
		</div>	
    );
  }
});

React.renderComponent(
  <InputForm />, document.getElementById('edit-item-container')
);
