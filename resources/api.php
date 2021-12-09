<?php
header("Access-Control-Allow-Origin: *");
$lang_file = '../dist/resources/lang.json';
$content = json_decode(file_get_contents($lang_file));
$menu_file = '../dist/resources/menu.json';
$lang_format_file = '../dist/resources/lang_format_file.json';
$menu_content = json_decode(file_get_contents($menu_file));
$icons_file = '../assets/icon-set/mdi.svg';
$icons_tags = simplexml_load_file($icons_file);
/** @noinspection PhpUndefinedMethodInspection */
$icons = $icons_tags->children()[0]->children();
//
//$myArray = [];
//foreach($content as $key => $value ){
//    $myArray[]['id'] = null;
//    $myArray[count($myArray)-1]['arName'] = $value->ar;
//    $myArray[count($myArray)-1]['enName'] = $value->en;
//    $myArray[count($myArray)-1]['LocalizationKey'] = $key;
//    $myArray[count($myArray)-1]['module'] = 1;
//}
//$string = json_encode($myArray, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES| JSON_UNESCAPED_UNICODE);
//open_file_and_put_content($string, $lang_format_file);
//echo "<pre>", print_r($myArray , true);
//die();

function isPartUppercase($string)
{
    return (bool)preg_match('/[A-Z]/', $string);
}


function open_file_and_put_content($string, $file)
{
    $file = fopen($file, 'w+');
    fwrite($file, $string);
    fclose($file);
}
/*
$views_path = './../src/views';

$directory = scandir($views_path);

$views = array_filter($directory, function ($item) {
    return strpos($item, '.html') !== false;
});*/
/*

$items_names = array_map(function ($item) {
    return substr($item->lang_key, strlen("menu_item_"));
}, $menu_content);

$find_items = array_map(function ($item) {
    return '/\{\{lang.' . $item . '\}\}/';
}, $items_names);

$replace_with = array_map(function ($item) {
    return '{{lang.menu_item_' . $item . '}}';
}, $items_names);*/

//echo "<pre>", print_r($replace_with, true);


//for ($i = 0; $i < count($find_items); $i++) {
    /*foreach ($views as $file) {
        $file_path = $views_path . '/' . $file;
        $view_content = file_get_contents($file_path);
        $view_content = preg_replace($find_items, $replace_with, $view_content);
        open_file_and_put_content($view_content , $file_path);
    }*/
//}


//echo preg_replace('/\{\{lang.dashboard\}\}/',"xxx" ,"<span>{{lang.dashboard}}</span>" );

//echo "<pre>", print_r($menu_item_names, true);

//echo "<pre>", print_r($views, true);


//die();


/*
$local_keys = [];
function map_menu($item){
    global $local_keys;
    $local_keys[] = $item->lang_key;
    $item->lang_key = "menu_item_".$item->lang_key;
    return $item ;
}
$menu_content = array_map('map_menu',$menu_content);

foreach( $content as $key => $value ){
    $pos = array_search($key , $local_keys);
    if($pos !== false){
        $field = 'menu_item_'.$local_keys[$pos];
        $content->{$field} = $value;
        unset($content->{$key});
    }
}



$content = json_encode($content, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
                open_file_and_put_content($content, $lang_file);
$menu_content = json_encode($menu_content, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
                open_file_and_put_content($menu_content, $menu_file);
die();*/


/**
 *
 * foreach($content as $key => $value ){
 * if(isPartUppercase($key)){
 * unset($content->{$key});
 * }
 * }
 * $content = json_encode($content, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
 * open_file_and_put_content($content, $lang_file);
 *
 * echo "<pre>" ,print_r($content, true ) , "</pre>";
 * die();
 **/


if (isset($_GET['action']) && $_GET['action'] == 'get') {
    echo json_encode($content);
    die();
}

if (isset($_GET['action']) && $_GET['action'] == 'add') {
    $key = @strtolower(@trim($_GET['key']));
    $arabic = trim($_GET['ar']);
    $english = trim($_GET['en']);

    $class = new stdClass();
    $class->ar = $arabic;
    $class->en = $english;

    if (property_exists($content, $key)) {
        echo json_encode(array('done' => false, "msg" => "Key Exists"));
    } else {
        $content->{$key} = $class;
        $string = json_encode($content, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        open_file_and_put_content($string, $lang_file);
        echo json_encode(array('done' => true));
    }
    die();
}

if (isset($_GET['action']) && $_GET['action'] == 'delete') {
    $key = @strtolower(@trim($_GET['key']));
    if ($content == null) {
        $content = new stdClass();
    }


    if (property_exists($content, $key)) {
        unset($content->{$key});
        $content = json_encode($content, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        open_file_and_put_content($content, $lang_file);
        echo json_encode(array('done' => true));
    } else {
        echo json_encode(array('done' => false, "msg" => "Key not Exists"));
    }
    die();
}

if (isset($_GET['action']) && $_GET['action'] == 'update') {
    extract($_GET);
    /** @var string $key */
    if (property_exists($content, $key)) {
        /** @var String $ar */
        $content->{$key}->ar = $ar;
        /** @var string $en */
        $content->{$key}->en = $en;
        $content = json_encode($content, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        open_file_and_put_content($content, $lang_file);
        echo json_encode(array('done' => true));
    } else {
        echo json_encode(array('done' => false, "msg" => "Key not Exists"));
    }
    die();
}

if (isset($_GET['action']) && $_GET['action'] === 'load_languages') {
    echo json_encode($content);
    die();
}

if (isset($_GET['action']) && $_GET['action'] === 'icons') {
    $icons_array = [];
    foreach ($icons as $icon) {
        array_push($icons_array, (string)$icon['id']);
    }
    echo json_encode($icons_array);
    die();
}


if ($_SERVER['REQUEST_METHOD'] == ('POST' || 'PATCH' || 'PUT')) {
    $menu_object = json_decode(file_get_contents('php://input'));
} else {
    $menu_object = [];
}


if ($_SERVER['REQUEST_METHOD'] === 'POST' && $_GET['action'] === 'setIcon') {
    foreach ($menu_content as $key => $value) {
        if ($menu_content[$key]->ID == $menu_object->ID) {
            unset($menu_object->children);
            $menu_content[$key] = $menu_object;
            break;
        }
    }

    $menu_content = json_encode($menu_content, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    open_file_and_put_content($menu_content, $menu_file);
    echo json_encode($menu_content);
    die();
}

/**
 * for menus
 */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
//    foreach ($menu_content as $key => $value) {
//        $menu_content[$key]->sort_value = 0;
//        $menu_content[$key]->active = true;
//        unset($menu_content[$key]->children);
//    }
//    $menu_content = json_encode($menu_content, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
//    open_file_and_put_content($menu_content, $menu_file);
    echo json_encode($menu_content);
    die();
}

if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
    foreach ($menu_object as $item) {
        foreach ($menu_content as $key => $value) {
            if ($value->ID === $item->ID) {
                $menu_content[$key]->sort_order = $item->sort_order;
            }
        }
    }
    $menu_content = json_encode($menu_content, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    open_file_and_put_content($menu_content, $menu_file);
    echo json_encode($menu_content);
    die();
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {

    foreach ($menu_content as $key => $value) {
        if ($value->ID == $menu_object->ID) {
            $menu_content[$key] = $menu_object;
        }
    }

    $menu_content = json_encode($menu_content, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    open_file_and_put_content($menu_content, $menu_file);
    echo json_encode($menu_content);
    die();
}



